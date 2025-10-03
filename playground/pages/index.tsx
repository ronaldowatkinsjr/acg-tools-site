import Head from 'next/head';

import Layout from 'components/layout';
import { Demo } from 'demo';
import { ConnectionError } from 'components/connection-error';
import { CustomRpcInput } from 'components/custom-rpc-input';

const Home = () => {
  return (
    <Layout title="ACG Tools" subtitle="ACG Tools Site">
      <Head>
        <title>ACG Tools</title>
      </Head>
      <ConnectionError />
      <CustomRpcInput />
      <Demo />
    </Layout>
  );
};

export default Home;
