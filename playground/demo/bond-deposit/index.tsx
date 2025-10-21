import { Accordion, Input } from '@lidofinance/lido-ui';
import { Action } from 'components/action';
import { DEFAULT_VALUE, ValueType } from 'components/tokenInput';
import TokenInput from 'components/tokenInput/tokenInput';
import { useArkSDK } from 'providers/sdk';
import { useState } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import { transactionToast } from 'utils/transaction-toast';

export const BondDepositDemo = ({
  wrapInSection,
}: {
  wrapInSection?: boolean;
}) => {
  const { account: web3account = '0x0' } = useWeb3();
  const [depositValueState, setDepositValue] =
    useState<ValueType>(DEFAULT_VALUE);
  const [modeIdState, setModeId] = useState<number>(0);
  const { bondDeposit, views } = useArkSDK();

  const account = web3account as `0x{string}`;

  const body = (
    <>
      <Action
        title="Deposit"
        walletAction
        action={() => {
          const depositValue = depositValueState ?? BigInt(0);
          const modeId = BigInt(modeIdState) ?? BigInt(0);

          return bondDeposit.deposit({
            depositValue,
            modeId,
            account,
            callback: transactionToast,
          });
        }}
      >
        <TokenInput
          label="depositValue"
          value={depositValueState}
          placeholder="0.0"
          onChange={setDepositValue}
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
        title="Deposit Populate TX"
        walletAction
        action={() => {
          const depositValue = depositValueState ?? BigInt(0);
          const modeId = BigInt(modeIdState) ?? BigInt(0);

          bondDeposit.depositPopulateTx({
            account,
            depositValue,
            modeId,
          });
        }}
      /> */}
      <Action
        title="Deposit Simulate Tx"
        walletAction
        action={() => {
          const depositValue = depositValueState ?? BigInt(0);
          const modeId = BigInt(modeIdState) ?? BigInt(0);

          return bondDeposit.depositSimulateTx({
            account,
            depositValue,
            modeId,
          });
        }}
      />
    </>
  );

  return wrapInSection && wrapInSection == true ? (
    <Accordion summary="Execute Bond">{body}</Accordion>
  ) : (
    body
  );
};
