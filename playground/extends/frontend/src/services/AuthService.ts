import ApiService from './ApiService';
import { API_CONFIG } from '../configs/appConfig';

export interface UserDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  role: string;
  currentLevel?: string;
  referralCode: string;
  amountBondedArk: string;
  amountBondedUsdt: string;
  currentSark: string;
  amountBondedArkWithoutWithdrawal: string;
  amountBondedUsdtWithoutWithdrawal: string;
  uplineTree: Record<string, string>;
  directReferralCount: number;
  totalDownlineAmountArk: string;
  totalDownlineAmountUsdt: string;
  totalDownlineSark: string;
  totalDownlineAmountArkWithoutWithdrawal: string;
  totalDownlineAmountUsdtWithoutWithdrawal: string;
  highestDirectReferralTeamArk: string;
  highestDirectReferralTeamArkWithoutWithdrawal: string;
  highestDirectReferralTeamLeadUserId?: string;
  teamReferralCount: Record<string, number>;
  isWhitelistLinearRelease: boolean;
  isWhitelistTurbine: boolean;
}

export interface WalletSignInParams {
  address: string;
  signature: string;
  referralCode?: string;
}

export interface GeetestValidation {
  captcha_id: string;
  captcha_output: string;
  gen_time: string;
  lot_number: string;
  pass_token: string;
}

export interface GetNonceResponse {
  nonce: string;
}

export interface SignInResponse {
  user: UserDto;
  token: {
    expiresIn: number; // in seconds
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  expiresIn: number;
  accessToken: string;
  refreshToken: string;
}

// -----  API function  -----
export const AuthService = {
  async getNonce(address: string): Promise<GetNonceResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'auth/tool-nonce',
      method: 'post',
      data: {
        address,
      },
    });
    return response.data;
  },

  async signIn(data: WalletSignInParams): Promise<SignInResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'auth/tool-login',
      method: 'post',
      data,
    });
    return response.data;
  },

  async me(): Promise<UserDto> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'auth/me',
      method: 'get',
    });
    return response.data;
  },

  async refreshToken(data: RefreshTokenParams): Promise<RefreshTokenResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'auth/refresh',
      method: 'post',
      data,
    });
    return response.data;
  },

  async checkAddressExists(address: string): Promise<boolean> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'auth/exists',
      method: 'get',
      params: { address },
    });
    return response.data;
  },
};
