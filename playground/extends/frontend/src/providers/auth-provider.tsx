'use client';

import { toDecimal } from '../lib/decimal-utils';
import { setWagmiDisconnect } from '../services/ApiService';
import { AuthService, UserDto } from '../services/AuthService';
import { AxiosError } from 'axios';
import Decimal from 'decimal.js';
import Cookies from 'js-cookie';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  useAccount,
  useChainId,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from 'wagmi';
import * as config from '../../../../config/index';
import { toast } from '@lidofinance/lido-ui';
import { TypeOptions } from 'react-toastify';
import { supportedChains } from 'env-dynamics.mjs';
import { useSupportedChains } from 'reef-knot/web3-react';

export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  address: string;
  role: string;
  currentLevel?: string;
  referralCode: string;
  amountBondedArk: Decimal;
  amountBondedUsdt: Decimal;
  currentSark: Decimal;
  amountBondedArkWithoutWithdrawal: Decimal;
  amountBondedUsdtWithoutWithdrawal: Decimal;
  uplineTree: Record<string, string>;
  directReferralCount: Decimal;
  totalDownlineAmountArk: Decimal;
  totalDownlineAmountUsdt: Decimal;
  totalDownlineSark: Decimal;
  totalDownlineAmountArkWithoutWithdrawal: Decimal;
  totalDownlineAmountUsdtWithoutWithdrawal: Decimal;
  highestDirectReferralTeamArk: Decimal;
  highestDirectReferralTeamArkWithoutWithdrawal: Decimal;
  highestDirectReferralTeamLeadUserId?: string;
  teamReferralCount: Record<string, number>;
  isWhitelistLinearRelease: boolean;
  isWhitelistTurbine: boolean;
}

export type AuthStep =
  | 'connect'
  | 'check-address'
  | 'switching-chain'
  | 'captcha'
  | 'captcha-processing'
  | 'referral'
  | 'sign'
  | 'success';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConnected: boolean;
  address: string | undefined;
  currentStep: AuthStep;
  authData: {
    addressExists?: boolean;
    isNewUser?: boolean;
    nonce?: string;
    message?: string;
    signature?: string;
    referralCode?: string;
    requiresReferral?: boolean;
    geetestValidation?: any;
  };
  userRejectedSign: boolean;
  authenticate: (
    action: 'check-address-and-nonce' | 'verify-captcha' | 'authenticate',
    data?: any,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const handleAuthError = (
  error: unknown,
  context: 'address-check' | 'nonce' | 'sign' | 'referral',
): { message: string } => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<{ message: string; code?: string }>;
    const statusCode = axiosError.response?.status;
    const errorCode = axiosError.response?.data?.code;

    if (!axiosError.response) {
      return {
        message: 'messages.errors.auth.failed.message',
      };
    }

    switch (context) {
      case 'address-check':
        if (statusCode === 429) {
          return {
            message: 'messages.errors.auth.tooManyAttempts.message',
          };
        }
        return {
          message: 'messages.errors.auth.checkFailed.message',
        };

      case 'nonce':
        if (statusCode === 429) {
          return {
            message: 'messages.errors.auth.tooManyAttempts.message',
          };
        }
        return {
          message: 'messages.errors.auth.setupFailed.message',
        };

      case 'sign':
        if (statusCode === 401) {
          return {
            message: 'messages.errors.auth.verificationFailed.message',
          };
        }
        if (statusCode === 400) {
          // Check for whitelist error
          const errorMessage =
            axiosError.response?.data?.message?.toLowerCase() || '';
          if (
            errorMessage.includes('addressnotwhitelisted') ||
            errorMessage.includes('not whitelisted')
          ) {
            return {
              message: 'messages.errors.auth.notWhitelisted.message',
            };
          }
          return {
            message: 'messages.errors.auth.somethingWentWrong.message',
          };
        }
        return {
          message: 'messages.errors.auth.somethingWentWrong.message',
        };

      case 'referral':
        if (statusCode === 404 || errorCode === 'INVALID_REFERRAL') {
          return {
            message: 'messages.errors.auth.invalidCode.message',
          };
        }
        if (statusCode === 409 || errorCode === 'ALREADY_REGISTERED') {
          return {
            message: 'messages.errors.auth.alreadyRegistered.message',
          };
        }
        return {
          message: 'messages.errors.auth.registrationFailed.message',
        };

      default:
        return {
          message: 'messages.errors.auth.somethingWentWrong.message',
        };
    }
  }

  if (error instanceof Error) {
    return {
      message: 'messages.errors.auth.somethingWentWrong.message',
    };
  }

  return {
    message: 'messages.errors.auth.somethingWentWrong.message',
  };
};

const showToast = (message: string, type: TypeOptions) =>
  toast(`${message}`, { type });

export function transformUserData(user: UserDto): User {
  return {
    id: user.id,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    address: user.address,
    role: user.role,
    currentLevel: user.currentLevel,
    referralCode: user.referralCode,
    amountBondedArk: toDecimal(user.amountBondedArk),
    amountBondedUsdt: toDecimal(user.amountBondedUsdt),
    currentSark: toDecimal(user.currentSark),
    amountBondedArkWithoutWithdrawal: toDecimal(
      user.amountBondedArkWithoutWithdrawal,
    ),
    amountBondedUsdtWithoutWithdrawal: toDecimal(
      user.amountBondedUsdtWithoutWithdrawal,
    ),
    uplineTree: user.uplineTree,
    directReferralCount: toDecimal(user.directReferralCount),
    totalDownlineAmountArk: toDecimal(user.totalDownlineAmountArk),
    totalDownlineAmountUsdt: toDecimal(user.totalDownlineAmountUsdt),
    totalDownlineSark: toDecimal(user.totalDownlineSark),
    totalDownlineAmountArkWithoutWithdrawal: toDecimal(
      user.totalDownlineAmountArkWithoutWithdrawal,
    ),
    totalDownlineAmountUsdtWithoutWithdrawal: toDecimal(
      user.totalDownlineAmountUsdtWithoutWithdrawal,
    ),
    highestDirectReferralTeamArk: toDecimal(user.highestDirectReferralTeamArk),
    highestDirectReferralTeamArkWithoutWithdrawal: toDecimal(
      user.highestDirectReferralTeamArkWithoutWithdrawal,
    ),
    highestDirectReferralTeamLeadUserId:
      user.highestDirectReferralTeamLeadUserId,
    teamReferralCount: user.teamReferralCount,
    isWhitelistLinearRelease: user.isWhitelistLinearRelease,
    isWhitelistTurbine: user.isWhitelistTurbine,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { supportedChains } = useSupportedChains();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  // Utility function to determine target chain
  const getTargetChain = useCallback(() => {
    // Priority: env var > environment-based default
    const defaultChain = config.dynamics.defaultChain;
    if (config.dynamics.supportedChains.includes(defaultChain))
      return defaultChain;

    // Fallback based on environment
    return config.dynamics.defaultChain;
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('connect');
  const [authData, setAuthData] = useState<{
    addressExists?: boolean;
    isNewUser?: boolean;
    nonce?: string;
    message?: string;
    signature?: string;
    referralCode?: string;
    requiresReferral?: boolean;
    geetestValidation?: any;
  }>({});
  const [hasAttemptedAutoSign, setHasAttemptedAutoSign] = useState(false);
  const [userRejectedSign, setUserRejectedSign] = useState(false);
  const [hasAttemptedAddressCheck, setHasAttemptedAddressCheck] =
    useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastCheckedAddress, setLastCheckedAddress] = useState<
    string | undefined
  >(undefined);

  const resetAuthState = useCallback(() => {
    setUser(null);
    setCurrentStep('connect');
    setAuthData({});
    setHasAttemptedAutoSign(false);
    setUserRejectedSign(false);
    setHasAttemptedAddressCheck(false);
    setWasConnected(false);
    setLastCheckedAddress(undefined);

    Cookies.remove('token');
    Cookies.remove('refreshToken');
  }, []);

  const authenticate = useCallback(
    async (
      action: 'check-address-and-nonce' | 'verify-captcha' | 'authenticate',
      data: any = {},
    ) => {
      if (!address) {
        showToast('noWalletFound', 'error');
        return;
      }

      setIsLoading(true);
      try {
        if (action === 'check-address-and-nonce') {
          setHasAttemptedAddressCheck(true);

          // Check if current chain is supported
          if (
            !supportedChains.map(({ chainId }) => chainId).includes(chainId)
          ) {
            setCurrentStep('switching-chain');

            try {
              const targetChain = getTargetChain();
              await switchChainAsync({ chainId: targetChain });

              // Chain switch successful, continue with authentication
              showToast('networkSwitched', 'success');
            } catch (switchError: any) {
              // User rejected or switch failed
              showToast('chainSwitchFailed', 'error');
              setCurrentStep('connect');
              setIsLoading(false);
              return;
            }
          }

          // Track which address we're checking
          setLastCheckedAddress(address);

          // Always go to captcha step first for bot protection
          setCurrentStep('captcha');
        } else if (action === 'verify-captcha') {
          // Captcha verification completed, show processing state immediately
          setCurrentStep('captcha-processing');

          // Fetch both user existence and nonce in parallel with geetest validation
          const [addressExists, nonceResponse] = await Promise.all([
            AuthService.checkAddressExists(address),
            AuthService.getNonce(address),
          ]);

          setAuthData({
            addressExists,
            isNewUser: !addressExists,
            nonce: nonceResponse.nonce,
          });

          if (addressExists) {
            // Existing user - go to sign step
            setCurrentStep('sign');
          } else {
            // New user - show referral step
            setCurrentStep('referral');
          }
        } else if (action === 'authenticate') {
          // Sign in step - try to sign in with signature and geetest validation
          const authAddress = data.address || address;

          const signInData: any = {
            address: authAddress,
            signature: data.signature,
          };

          // If this is a new user, include the referral code
          if (authData.isNewUser && data.referralCode) {
            signInData.referralCode = data.referralCode;
          }

          const response = await AuthService.signIn(signInData);

          // Success - user is authenticated
          setCurrentStep('success');

          const user = transformUserData(response.user);
          setUser(user);

          Cookies.set('token', response.token.accessToken, {
            expires: response.token.expiresIn / (24 * 60 * 60),
          });
          Cookies.set('refreshToken', response.token.refreshToken, {
            expires: 30,
          });

          showToast(
            authData.isNewUser
              ? 'accountCreatedAndConnected'
              : 'walletConnected',
            'success',
          );
        }
      } catch (error: unknown) {
        // Handle errors based on the action
        let errorContext: 'address-check' | 'nonce' | 'sign' | 'referral';

        if (
          action === 'check-address-and-nonce' ||
          action === 'verify-captcha'
        ) {
          errorContext = 'address-check';
        } else {
          errorContext = 'sign';
        }

        const errorInfo = handleAuthError(error, errorContext);
        showToast(errorInfo.message, 'error');

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      address,
      authData.isNewUser,
      authData.geetestValidation,
      chainId,
      getTargetChain,
      switchChainAsync,
    ],
  );

  useEffect(() => {
    setWagmiDisconnect(disconnect);
  }, [disconnect]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('token');

      if (token) {
        try {
          const userData = await AuthService.me();
          const user = transformUserData(userData);
          setUser(user);
          setCurrentStep('success');
        } catch {
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          setUser(null);
        }
      }

      setIsMounted(true);
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  // Handle account switching
  useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    if (user && address && user.address !== address && isConnected) {
      setUser(null);
      setCurrentStep('check-address');
      setAuthData({});
      setHasAttemptedAutoSign(false);
      setUserRejectedSign(false);
      setHasAttemptedAddressCheck(false);
      setLastCheckedAddress(undefined);

      Cookies.remove('token');
      Cookies.remove('refreshToken');

      showToast(
        `accountSwitched, connectingTo: ${address.slice(0, 6)}...${address.slice(-4)}`,
        'success',
      );
    }
  }, [user, address, isConnected, isLoading, isInitialized]);

  // Handle address switching during authentication flow (when user is not authenticated)
  useEffect(() => {
    if (!isInitialized || isLoading || isLoggingOut) {
      return;
    }

    // Check if address changed during auth flow (user is not authenticated yet)
    if (
      !user &&
      address &&
      lastCheckedAddress &&
      address !== lastCheckedAddress &&
      isConnected
    ) {
      // Address changed during auth - reset everything and restart for new address
      setCurrentStep('check-address');
      setAuthData({});
      setHasAttemptedAutoSign(false);
      setUserRejectedSign(false);
      setHasAttemptedAddressCheck(false);
      setLastCheckedAddress(undefined);

      showToast(
        `accountSwitched, connectingTo: ${address.slice(0, 6)}...${address.slice(-4)}`,
        'info',
      );
    }
  }, [
    address,
    lastCheckedAddress,
    user,
    isConnected,
    isLoading,
    isInitialized,
    isLoggingOut,
    console.log,
  ]);

  // Track wallet connection state - prevents false disconnects on page refresh
  useEffect(() => {
    if (!isMounted || isLoggingOut) {
      return;
    }

    // Wait for wagmi to finish connecting before making decisions
    if (isConnecting) {
      return;
    }

    if (isConnected && !user && currentStep === 'connect') {
      // Wallet is connected but still on connect step - move to check-address
      setWasConnected(true);
      setCurrentStep('check-address');
      setHasAttemptedAutoSign(false);
      setUserRejectedSign(false);
      setHasAttemptedAddressCheck(false);
    } else if (wasConnected && !isConnected) {
      // Actual disconnection (was connected before, now not)
      setCurrentStep('connect');
      setWasConnected(false);

      const currentToken = Cookies.get('token');
      if (currentToken || user) {
        resetAuthState();
        showToast(
          'walletDisconnected: messages.info.auth.pleaseConnectAgain',
          'info',
        );
      }
    } else if (isConnected && user) {
      // Both connected and authenticated - track connection
      setWasConnected(true);
    }
  }, [
    isMounted,
    isConnecting,
    isLoggingOut,
    isConnected,
    user,
    wasConnected,
    currentStep,
    resetAuthState,
    console.log,
  ]);

  // Check address existence and get nonce when wallet connects
  useEffect(() => {
    if (
      isConnected &&
      currentStep === 'check-address' &&
      !hasAttemptedAddressCheck &&
      !isLoading
    ) {
      authenticate('check-address-and-nonce').catch(() => {
        // Error handled in authenticate function
      });
    }
  }, [
    isConnected,
    currentStep,
    hasAttemptedAddressCheck,
    authenticate,
    isLoading,
  ]);

  // Auto-sign when nonce is received (for existing users)
  useEffect(() => {
    const shouldAutoSign =
      isConnected &&
      currentStep === 'sign' &&
      authData.nonce &&
      !hasAttemptedAutoSign &&
      !userRejectedSign &&
      !user &&
      !isLoading &&
      authData.addressExists; // Only auto-sign for existing users

    if (shouldAutoSign) {
      setHasAttemptedAutoSign(true);

      const autoSign = async () => {
        try {
          const signature = await signMessageAsync({
            message: authData.nonce!,
          });
          await authenticate('authenticate', { signature });
        } catch {
          setUserRejectedSign(true);
        }
      };

      autoSign();
    }
  }, [
    isConnected,
    currentStep,
    authData.nonce,
    authData.addressExists,
    hasAttemptedAutoSign,
    userRejectedSign,
    user,
    isLoading,
    signMessageAsync,
    authenticate,
  ]);

  const logout = () => {
    setIsLoggingOut(true);
    resetAuthState();
    disconnect();
    showToast('walletDisconnected', 'info');
  };

  // Reset logout flag when disconnect completes
  useEffect(() => {
    if (isLoggingOut && !isConnected) {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, isConnected]);

  const value: AuthContextType = {
    user,
    isLoading,
    isConnected,
    address,
    currentStep,
    authData,
    userRejectedSign,
    authenticate,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
