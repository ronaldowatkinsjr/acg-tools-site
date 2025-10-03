import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { ArkSDK } from '@a42n-olympus/ark-dao-sdk';
import invariant from 'tiny-invariant';
import { usePublicClient, useWalletClient } from 'wagmi';

const context = createContext<ArkSDK | null>(null);

export const useArkSDK = () => {
  const value = useContext(context);
  invariant(value, 'useArkSDK was used outside ArkSDKProvider');
  return value;
};

export const ArkSDKProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const publicClient = usePublicClient();
  const chainId = publicClient?.chain.id;
  const { data: walletClient } = useWalletClient();
  const value = useMemo(() => {
    const sdk = new ArkSDK({
      chainId: chainId as any,
      rpcProvider: publicClient as any,
      web3Provider: walletClient as any,
      logMode: 'debug',
    });
    // inject lido_sdk for console access
    if (typeof window !== 'undefined') (window as any).lido_sdk = sdk;
    return sdk;
  }, [chainId, publicClient, walletClient]);

  return <context.Provider value={value}>{children}</context.Provider>;
};
