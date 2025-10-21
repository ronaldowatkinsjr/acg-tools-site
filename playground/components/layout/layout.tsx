import Header from 'components/layout/header';
import Main from 'components/layout/main';
import Head from 'next/head';
import { FC, PropsWithChildren } from 'react';
import Footer from './footer/footer';
import { LayoutSubTitleStyle, LayoutTitleStyle } from './layoutStyles';
import { LayoutProps } from './types';

const Layout: FC<PropsWithChildren<LayoutProps>> = (props) => {
  const { title, subtitle } = props;
  const { children } = props;

  return (
    <>
      <Head>
        <meta name="description" content="Lido SDK Playground" />
      </Head>
      <Header />
      <Main>
        <LayoutTitleStyle>{title}</LayoutTitleStyle>
        <LayoutSubTitleStyle>{subtitle}</LayoutSubTitleStyle>
        {children}
      </Main>
      <Footer />
    </>
  );
};

export default Layout;
