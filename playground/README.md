# ACG Tools Site

## Local build steps

1. Install nodejs from the [official website](https://nodejs.org/en/downloadhttps://nodejs.org/en/download)

   Then, install yarn as below

   ```bash
   npm install -g yarn
   ```

2. Install required packages

   ```bash
   yarn install
   ```

3. Build packages

   ```bash
   yarn build:packages
   ```

4. Go to `/playground` directory

   ```bash
   cd playground
   ```

5. Create `.env` from `.env.example`

   For `RPC_PROVIDER_URL_56`, it's recommended to replace the provided rpc with a reliable third-party rpc for a consistent & uninterrupted connection.

   For `WALLETCONNECT_PROJECT_ID`, retrieve the `projectId` from Reown dashboard

   ```bash
   cp .env.example .env
   ```

6. Launch dev app

   ```bash
   yarn dev
   ```
