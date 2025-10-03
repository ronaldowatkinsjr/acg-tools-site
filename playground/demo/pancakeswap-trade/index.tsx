import {
  ARK_CONTRACT_NAMES,
  ERROR_CODE,
  SDKError,
} from '@a42n-olympus/ark-dao-sdk';
import { Accordion, Input } from '@lidofinance/lido-ui';
import { ChainId } from '@pancakeswap/chains';
import { CurrencyAmount, Percent } from '@pancakeswap/swap-sdk-core';
import { Fetcher, Route, Router, Trade } from '@pancakeswap/v2-sdk';
import { Action } from 'components/action';
import { DEFAULT_VALUE, ValueType } from 'components/tokenInput';
import TokenInput from 'components/tokenInput/tokenInput';
import { useArkSDK } from 'providers/sdk';
import { useCallback, useMemo, useState } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import {
  Address,
  ContractFunctionParameters,
  fromHex,
  Hex,
  parseAbi,
} from 'viem';

const swapAbi = parseAbi([
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] calldata path,address to,uint256 deadline) external returns (uint256[] memory amounts)',
]);

export const PancakeSwapDemo = () => {
  const { account: web3account = '0x0' } = useWeb3();

  const [inputValueState, setInputValue] = useState<ValueType>(DEFAULT_VALUE);
  const inputValue = inputValueState ?? BigInt(0);
  const [slippageState, setSlippage] = useState<number>(1); // whole number e.g. 1% = 1

  const { core, ark, usdt } = useArkSDK();

  const account = web3account as `0x${string}`;

  const PANCAKE_METADATA = useMemo(async () => {
    const ark_ = await Fetcher.fetchTokenData(
      core.chainId as unknown as ChainId,
      ark.contractAddress(),
      undefined,
      '',
    );
    const usdt_ = await Fetcher.fetchTokenData(
      core.chainId as unknown as ChainId,
      usdt.contractAddress(),
      undefined,
      '',
    );

    return {
      ark_,
      usdt_,
      pair: await Fetcher.fetchPairData(usdt_, ark_),
    };
  }, [core.chainId]);

  const trade = useCallback(
    async (
      inputToken: 'ark' | 'usdt',
      inputAmount: bigint,
      slippage: number,
      simulateOnly: boolean = false,
    ) => {
      const pancakeParams = await PANCAKE_METADATA;

      // construct trade
      const trade = Trade.exactIn(
        new Route(
          [
            await Fetcher.fetchPairData(
              pancakeParams.usdt_,
              pancakeParams.ark_,
            ),
          ],
          inputToken == 'ark' ? pancakeParams.ark_ : pancakeParams.usdt_,
          inputToken == 'ark' ? pancakeParams.usdt_ : pancakeParams.ark_,
        ),
        CurrencyAmount.fromRawAmount(
          inputToken == 'ark' ? pancakeParams.ark_ : pancakeParams.usdt_,
          inputAmount,
        ),
      );

      // construct tx params
      const pancakeSdkParam = Router.swapCallParameters(trade, {
        allowedSlippage: new Percent(slippage, 100),
        ttl: 60, // 60 seconds before swap tx expires
        recipient: account,
        feeOnTransfer: true,
      });

      const txParam: ContractFunctionParameters<
        typeof swapAbi,
        'nonpayable',
        'swapExactTokensForTokensSupportingFeeOnTransferTokens'
      > = {
        abi: swapAbi,
        address: core.getContractAddress(ARK_CONTRACT_NAMES.routerV2),
        functionName: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
        args: [
          fromHex(pancakeSdkParam.args[0] as Hex, 'bigint'),
          fromHex(pancakeSdkParam.args[1] as Hex, 'bigint'),
          pancakeSdkParam.args[2] as Address[],
          pancakeSdkParam.args[3] as Address,
          fromHex(pancakeSdkParam.args[4] as Hex, 'bigint'),
        ],
      };

      try {
        // execute tx
        return await core.web3Provider!.writeContract({
          ...txParam,
          account,
          chain: core.chain,
        });
      } catch (error) {
        throw new SDKError({
          code: ERROR_CODE.TRANSACTION_ERROR,
          message: (error as Error).message,
          error,
        });
      }
    },
    [PANCAKE_METADATA, account, core],
  );

  return (
    <Accordion summary="Execute Trade">
      <Action
        title="Swap ARK to USDT"
        walletAction
        action={async () => trade('ark', inputValue, slippageState)}
      >
        <TokenInput
          label="Deposit Value"
          value={inputValue}
          placeholder="0.0"
          onChange={setInputValue}
        />
        <Input
          label="Slippage (e.g. 1 = 1%)"
          placeholder="1"
          value={slippageState.toString()}
          onChange={(event) => setSlippage(Number(event.currentTarget.value))}
        />
      </Action>
      <Action
        title="Swap USDT to ARK"
        walletAction
        action={async () => trade('usdt', inputValue, slippageState)}
      />
      <Action title="PancakeSwap Trade Info" action={() => PANCAKE_METADATA} />
      <Action
        title="Address Pancake Router V2"
        action={() => core.getContractAddress(ARK_CONTRACT_NAMES.routerV2)}
      />
    </Accordion>
  );
};
