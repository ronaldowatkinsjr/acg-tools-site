/** @type Record<number,string> */
export const rpcProviderUrls = {
  // bsc
  56:
    process.env[`RPC_PROVIDER_URL_56`] || 'https://bsc-dataseed.bnbchain.org/',
};
/** @type number */
export const defaultChain = parseInt(process.env.DEFAULT_CHAIN, 10) || 56;
/** @type number[] */
export const supportedChains = process.env?.SUPPORTED_CHAINS?.split(',').map(
  (chainId) => parseInt(chainId, 10),
) ?? [56];
export const walletconnectProjectId =
  process.env.WALLETCONNECT_PROJECT_ID || '5c49f5fb96b04b878f972d12c34a1c04';
export const backendApiBaseURL = 'https://bsc-mainnet.lilc02qcmlad19c12.site/';
