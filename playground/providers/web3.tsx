/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CHAINS } from '@a42n-olympus/ark-dao-sdk';
import { useThemeToggle } from '@lidofinance/lido-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dynamics } from 'config';
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { WalletsModalForEth } from 'reef-knot/connect-wallet-modal';
import {
  AutoConnect,
  getWalletsDataList,
  ReefKnot,
} from 'reef-knot/core-react';
import { WalletsListEthereum } from 'reef-knot/wallets';
import invariant from 'tiny-invariant';
import { createConfig, http, WagmiProvider } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { Chain } from 'wagmi/chains';

type ChainsList = [Chain, ...Chain[]];

const wagmiChainsArray = Object.values(wagmiChains) as any as ChainsList;

const supportedChains = wagmiChainsArray as ChainsList;

const defaultChain =
  wagmiChainsArray.find((chain) => chain.id === dynamics.defaultChain) ||
  supportedChains[0]; // first supported chain as fallback;

const queryClient = new QueryClient();

type CustomRpcContextValue = {
  customRpc: Record<number, string | null>;
  activeRpc: Record<number, string>;
  setCustomRpcUrl: (chain: number, rpcUrl: string | null) => void;
};

const CustomRpcContext = createContext<CustomRpcContextValue | null>(null);
CustomRpcContext.displayName = 'CustomRpcContext';

export const useCustomRpc = () => {
  const context = useContext(CustomRpcContext);
  invariant(context);
  return context;
};

const Web3Provider: FC<PropsWithChildren> = ({ children }) => {
  const { themeName } = useThemeToggle();
  const [customRpc, setCustomRpc] = useState<Record<number, string | null>>({});

  const activeRpc: Record<number, string> = useMemo(() => {
    const getRpc = (chain: number): string =>
      customRpc[chain] ?? dynamics.rpcProviderUrls[chain];
    return {
      [CHAINS.BSC_mainnet]: getRpc(CHAINS.BSC_mainnet),
      [CHAINS.BSC_testnet]: getRpc(CHAINS.BSC_testnet),
      [CHAINS.dev]: getRpc(CHAINS.dev),
    };
  }, [customRpc]);

  const customRpcContextValue = useMemo(
    () => ({
      customRpc,
      activeRpc,
      setCustomRpcUrl: (chain: number, rpcUrl: string | null) => {
        setCustomRpc((old) => ({ ...old, [chain]: rpcUrl }));
      },
    }),
    [customRpc, activeRpc],
  );

  const { walletsDataList } = useMemo(() => {
    return getWalletsDataList({
      walletsList: WalletsListEthereum,
      rpc: activeRpc,
      walletconnectProjectId: dynamics.walletconnectProjectId,
      defaultChain: defaultChain,
    });
  }, [activeRpc]);

  const config = useMemo(() => {
    return createConfig({
      chains: supportedChains,
      ssr: true,
      multiInjectedProviderDiscovery: false,
      transports: supportedChains.reduce(
        (res, curr) => ({
          ...res,
          [curr.id]: http(activeRpc[curr.id], { batch: true }),
        }),
        {},
      ),
    });
  }, [activeRpc]);

  return (
    <CustomRpcContext.Provider value={customRpcContextValue}>
      <WagmiProvider config={config} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <ReefKnot
            rpc={activeRpc}
            chains={supportedChains}
            walletDataList={walletsDataList}
          >
            <AutoConnect autoConnect />

            {children}
            <WalletsModalForEth shouldInvertWalletIcon={themeName === 'dark'} />
          </ReefKnot>
        </QueryClientProvider>
      </WagmiProvider>
    </CustomRpcContext.Provider>
  );
};

export default Web3Provider;
