import { FC, PropsWithChildren } from 'react';
import { CookieThemeProvider, ThemeName } from '@lidofinance/lido-ui';

import { GlobalStyle } from 'styles';

import ModalProvider from './modals';
import Web3Provider from './web3';
import { ArkSDKProvider } from './sdk';
import { ArkDAODataProvider } from 'extends/frontend/src/providers/arkdao-data.provider';
import { AuthProvider } from 'extends/frontend/src/providers/auth-provider';
import { RedeemableCapitalCacheProvider } from 'extends/frontend/src/providers/claimable-capital-cache.provider';
export { MODAL, ModalContext } from './modals';

const Providers: FC<PropsWithChildren> = ({ children }) => (
  <CookieThemeProvider>
    {/* @ts-ignore */}
    <GlobalStyle />
    <Web3Provider>
      <ArkSDKProvider>
        <AuthProvider>
          <ArkDAODataProvider>
            <RedeemableCapitalCacheProvider>
              <ModalProvider>{children}</ModalProvider>
            </RedeemableCapitalCacheProvider>
          </ArkDAODataProvider>
        </AuthProvider>
      </ArkSDKProvider>
    </Web3Provider>
  </CookieThemeProvider>
);

export default Providers;
