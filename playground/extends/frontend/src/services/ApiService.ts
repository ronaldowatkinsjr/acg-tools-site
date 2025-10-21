import { AuthService } from './AuthService';
import { API_CONFIG } from '../configs/appConfig';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';

export interface PageDto<T> {
  data: T[];
  meta: {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface PageOptionsDto {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  q?: string;
}

const unauthorizedCode: number[] = [401];

// Global reference to wagmi disconnect function
let wagmiDisconnect: (() => void) | null = null;

// Function to set the disconnect reference
export const setWagmiDisconnect = (disconnectFn: () => void) => {
  wagmiDisconnect = disconnectFn;
};

// Logout function to handle unauthorized access
const handleUnauthorized = () => {
  const wasAlreadyCleared = !Cookies.get('token');

  Cookies.remove('token', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });

  // Only disconnect wallet if this wasn't already cleared (avoid double disconnection)
  if (!wasAlreadyCleared && wagmiDisconnect) {
    wagmiDisconnect();
    // Error display now handled by unified status system when components encounter 401 errors
  }
};

const AxiosService: AxiosInstance = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: 60000, // milliseconds
});

AxiosService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('token');

    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Track if refresh is in progress to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

AxiosService.interceptors.response.use(
  (response: AxiosResponse) => {
    if (unauthorizedCode.includes(response.status)) {
      handleUnauthorized();
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 unauthorized
    if (error.status && unauthorizedCode.includes(error.status)) {
      const refreshToken = Cookies.get('refreshToken');

      // Skip refresh for auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        handleUnauthorized();
        return Promise.reject(error);
      }

      if (refreshToken && !originalRequest._retry) {
        if (isRefreshing) {
          // Wait for the token refresh to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              resolve(AxiosService(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await AuthService.refreshToken({ refreshToken });

          // Save new tokens
          Cookies.set('token', response.accessToken, {
            expires: response.expiresIn / (24 * 60 * 60), // Convert seconds to days
          });
          Cookies.set('refreshToken', response.refreshToken, {
            expires: 30, // Refresh token expires in 30 days
          });

          onRefreshed(response.accessToken);
          originalRequest.headers['Authorization'] = 'Bearer ' + response.accessToken;

          return AxiosService(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          handleUnauthorized();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        handleUnauthorized();
      }
    }

    // Components now handle their own errors via useStatus() hook
    return Promise.reject(error);
  }
);

const ApiService = {
  fetchData(requestConfig: AxiosRequestConfig) {
    return AxiosService(requestConfig);
  },
};

export default ApiService;
