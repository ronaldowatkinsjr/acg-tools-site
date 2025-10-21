import { Accordion, Input } from '@lidofinance/lido-ui';
import { Action } from 'components/action';
import { DEFAULT_VALUE, ValueType } from 'components/tokenInput';
import TokenInput from 'components/tokenInput/tokenInput';
import { useArkSDK } from 'providers/sdk';
import { useState } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import { transactionToast } from 'utils/transaction-toast';

export const StakeDepositDemo = ({
  wrapInSection,
}: {
  wrapInSection?: boolean;
}) => {
  const { account: web3account = '0x0' } = useWeb3();
  const [stakeValueState, setStakeValue] = useState<ValueType>(DEFAULT_VALUE);
  const [modeIdState, setModeId] = useState<number>(0);
  const { stakeDeposit, views } = useArkSDK();

  const account = web3account as `0x{string}`;

  const body = (
    <>
      <Action
        title="Stake Deposit"
        walletAction
        action={() => {
          const stakeValue = stakeValueState ?? BigInt(0);
          const modeId = BigInt(modeIdState) ?? BigInt(0);

          return stakeDeposit.stake({
            stakeValue,
            modeId,
            account,
            callback: transactionToast,
          });
        }}
      >
        <TokenInput
          label="stakeValue"
          value={stakeValueState}
          placeholder="0.0"
          onChange={setStakeValue}
        />
        <Input
          label="modeId"
          placeholder="0"
          value={modeIdState}
          onChange={(e) => {
            const input =
              e.currentTarget.value == ''
                ? 0
                : parseInt(e.currentTarget.value, 10);
            if (!isNaN(input)) {
              setModeId(input);
            }
          }}
        />
      </Action>
      {/* <Action
        title="Stake Deposit Populate TX"
        walletAction
        action={() => {
          const stakeValue = stakeValueState ?? BigInt(0);
          const modeId = BigInt(modeIdState) ?? BigInt(0);

          stakeDeposit.stakePopulateTx({
            account,
            stakeValue,
            modeId,
          });
        }}
      /> */}
      <Action
        title="Stake Simulate Tx"
        walletAction
        action={() => {
          const stakeValue = stakeValueState ?? BigInt(0);
          const modeId = BigInt(modeIdState) ?? BigInt(0);

          return stakeDeposit.stakeSimulateTx({
            account,
            stakeValue,
            modeId,
          });
        }}
      />
    </>
  );

  return wrapInSection && wrapInSection == true ? (
    <Accordion summary="Execute Staking"></Accordion>
  ) : (
    body
  );
};
