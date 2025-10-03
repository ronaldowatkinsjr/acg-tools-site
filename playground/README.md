# ACG Tools Site

## Local build steps

1. Download the required ABI from https://download-directory.github.io/?url=https%3A%2F%2Fgithub.com%2FSunny-jean%2Fsc-500%2Ftree%2Fmain%2Fcore-abi and extract the zip file

2. Copy the folder into the root directory of this repository, as demonstrated by the command below. Make sure the terminal is checked out to the root directory of the repository

   ```bash
   cp -r <path to>/"Sunny-jean sc-500 main core-abi"/. .
   ```

3. Install nodejs from the [official website](https://nodejs.org/en/downloadhttps://nodejs.org/en/download)

   Then, install yarn as below 

   ```bash
   npm install -g yarn
   ```

4. Install required packages

   ```bash
   yarn install
   ```

5. Build packages

   ```bash
   yarn build:packages
   ```

6. Go to `/playground` directory

   ```bash
   cd playground
   ```

7. Create `.env` from `.env.example`

   For `RPC_PROVIDER_URL_56`, it's recommended to replace the provided rpc with a reliable third-party rpc for a consistent & uninterrupted connection.

   For `WALLETCONNECT_PROJECT_ID`, retrieve the `projectId` from Reown dashboard

   ```bash
   cp .env.example .env
   ```

8. Launch dev app

   ```bash
   yarn dev
   ```
