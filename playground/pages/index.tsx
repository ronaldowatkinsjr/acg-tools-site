import Head from 'next/head';

import Layout from 'components/layout';
import { Demo } from 'demo';
import { ConnectionError } from 'components/connection-error';
import { CustomRpcInput } from 'components/custom-rpc-input';

const Home = () => {
  return (
    <Layout
      title="A Chain Guru"
      subtitle="A Chain Guru is your all-in-one smart contract console.
Inspect, simulate, and execute blockchain functions, or auto-generate front-end components from your ABI in seconds."
    >
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
