import { ERROR_CODE, SDKError } from '@a42n-olympus/ark-dao-sdk';
import { Accordion, Input, Option, Select } from '@lidofinance/lido-ui';
import { Action } from 'components/action';
import { ActionBlock, Controls } from 'components/action/styles';
import { BondDepositDemo } from 'demo/bond-deposit';
import { BondRedeemDemo } from 'demo/bond-redeem';
import { StakeClaimDemo } from 'demo/stake-claim';
import { StakeDepositDemo } from 'demo/stake-deposit';
import { useArkSDK } from 'providers/sdk';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import {
  Abi,
  AbiFunction,
  Address,
  ContractFunctionName,
  ContractFunctionParameters,
  getAbiItem,
  zeroAddress,
} from 'viem';

export const ArbitaryFunctionCallDemo = () => {
  const { account: web3account = '0x0' } = useWeb3();
  const account = web3account as `0x${string}`;

  // set contract abi
  const [inputContractAbi, setInputContractAbi] = useState<string>('');
  const [currentContractAbi, setCurrentContractAbi] = useState<Abi>();

  // handle contract function param
  const {
    currentFunctionAbi,
    setCurrentFunctionAbi,
    renderContractFunctionParamInput,
    contractAddress,
    setContractAddress,
    executeFunctionCall,
  } = useContractFunctionParamInput();

  // define UI condition
  const { bondDeposit } = useArkSDK();
  const ABI = useMemo(
    () => [
      ...bondDeposit.getContractOlyV3Operator().abi,
      ...bondDeposit.getContractOlyV3BondFixedTermTeller().abi,
      ...bondDeposit.getContractOlyV3VARKVault().abi,
    ],
    [
      bondDeposit.getContractOlyV3Operator().abi,
      bondDeposit.getContractOlyV3BondFixedTermTeller().abi,
      bondDeposit.getContractOlyV3VARKVault().abi,
    ],
  );
  const BUILT_IN_CONTRACT_FUNCTIONS = useMemo(
    () =>
      ({
        [bondDeposit.getContractOlyV3Operator().address.toLowerCase()]: {
          eligibleFunctions: ['bondPurchase__V3'],
          ui: [<BondDepositDemo />],
        },
        [bondDeposit
          .getContractOlyV3BondFixedTermTeller()
          .address.toLowerCase()]: {
          eligibleFunctions: ['redeem__V3'],
          ui: [<BondRedeemDemo />],
        },
        [bondDeposit.getContractOlyV3VARKVault().address.toLowerCase()]: {
          eligibleFunctions: ['deposit__V3', 'withdraw__V3'],
          ui: [<StakeDepositDemo />, <StakeClaimDemo />],
        },
      }) satisfies {
        [key: string]: {
          eligibleFunctions: ContractFunctionName<typeof ABI, 'nonpayable'>[];
          ui: ReactNode[];
        };
      } as {
        [key: string]: { eligibleFunctions: string[]; ui: ReactNode[] };
      },
    [
      bondDeposit.getContractOlyV3Operator().abi,
      bondDeposit.getContractOlyV3BondFixedTermTeller().abi,
      bondDeposit.getContractOlyV3VARKVault().abi,
    ],
  );

  return (
    <>
      <Accordion summary="Set Contract Address">
        <Action title="Set Contract Address" action={async () => {}}>
          {/* contract address */}
          <Input
            label="Contract address"
            value={contractAddress}
            onChange={(e) =>
              setContractAddress(e.target.value.trim() as Address)
            }
          ></Input>
        </Action>
      </Accordion>
      <Accordion summary="Set Contract ABI">
        <Action
          title="Set Contract ABI"
          action={async () => {
            // parse abi into valid JSON format
            const parsedAbi = JSON.parse(inputContractAbi) as Abi;

            // validate ABI items
            if (
              parsedAbi.every((item) => {
                return (
                  item.type &&
                  typeof item.type === 'string' &&
                  [
                    'function',
                    'constructor',
                    'event',
                    'error',
                    'fallback',
                    'receive',
                  ].includes(item.type)
                );
              })
            ) {
              // set current abi
              setCurrentContractAbi(parsedAbi);

              // output current abi
              return parsedAbi;
            } else {
              // abi is invalid
              return {
                error: 'inputted abi is invalid',
              };
            }
          }}
        >
          <Input
            label="Contract ABI"
            value={JSON.stringify(currentContractAbi)}
            onChange={(event) => setInputContractAbi(event.target.value)}
          />
        </Action>
      </Accordion>
      <Accordion summary="Contract Function Call">
        <ActionBlock>
          <Controls>
            {/* function dropdown */}
            <Select
              label="Contract Function Name"
              onChange={(functionName) => {
                // set function abi
                const abi = getAbiItem({
                  abi: currentContractAbi!,
                  name: functionName as string,
                }) as AbiFunction;

                setCurrentFunctionAbi(abi);
              }}
            >
              {currentContractAbi &&
                (
                  currentContractAbi.filter(
                    ({ type }) => type == 'function',
                  ) as AbiFunction[]
                )
                  // only allow view function for now
                  // .filter(
                  //   ({ stateMutability }) =>
                  //     stateMutability == 'view' || stateMutability == 'pure',
                  // )
                  // display function names in the dropdown
                  .map(({ name }, i) => (
                    <Option
                      key={`contractfunctioncall-option-${i}`}
                      value={name}
                      children={name}
                    />
                  ))}
            </Select>
          </Controls>
        </ActionBlock>
        {/* display bonding/staking UI if proxy address is inputted, else use arbitary function param */}
        {contractAddress &&
        BUILT_IN_CONTRACT_FUNCTIONS[contractAddress.toLowerCase()] !=
          undefined &&
        currentFunctionAbi &&
        BUILT_IN_CONTRACT_FUNCTIONS[
          contractAddress.toLowerCase()
        ].eligibleFunctions.includes(currentFunctionAbi.name) ? (
          BUILT_IN_CONTRACT_FUNCTIONS[contractAddress.toLowerCase()].ui[
            BUILT_IN_CONTRACT_FUNCTIONS[
              contractAddress.toLowerCase()
            ].eligibleFunctions.findIndex(
              (value) => value == currentFunctionAbi.name,
            )
          ]
        ) : (
          <Action
            title="Execute Function Call"
            action={async () => executeFunctionCall()}
          >
            {/* function params */}
            {renderContractFunctionParamInput}
          </Action>
        )}
      </Accordion>
    </>
  );
};

const useContractFunctionParamInput = () => {
  const [currentFunctionAbi, setCurrentFunctionAbi] = useState<AbiFunction>();
  const [contractAddress, setContractAddress] = useState<Address>();
  const [functionArgs, setFunctionArgs] = useState<any[]>([]);
  const { core } = useArkSDK();
  const { account: web3account = zeroAddress } = useWeb3();
  const account = web3account as `0x${string}`;

  useEffect(() => {
    // reset functionArgs
    setFunctionArgs([]);
  }, [currentFunctionAbi]);

  const renderInput = useMemo(() => {
    if (!currentFunctionAbi) return <></>;

    const render = currentFunctionAbi.inputs.map(({ name, type }, argIndex) => (
      <Input
        key={`renderContractFunctionParamInput-${name}`}
        label={name}
        onChange={(e) => {
          const input = e.target.value;
          let args = [...functionArgs];
          const uintType = type.match(/^uint(\d+)$/);

          // assign arg
          if (uintType && Number(uintType[1]) <= 48) {
            args[argIndex] = Number(input);
          } else if (uintType && Number(uintType[1]) > 48) {
            args[argIndex] = BigInt(input);
          } else {
            args[argIndex] = input;
          }

          // set args
          setFunctionArgs(args);
        }}
      ></Input>
    ));

    return render;
  }, [currentFunctionAbi, functionArgs]);

  const executeFunctionCall = useCallback(async () => {
    if (!contractAddress)
      throw new SDKError({
        code: ERROR_CODE.INVALID_ARGUMENT,
        message: 'contract address must be defined',
      });
    if (!currentFunctionAbi)
      throw new SDKError({
        code: ERROR_CODE.INVALID_ARGUMENT,
        message: 'function must be defined',
      });

    const params = {
      abi: [currentFunctionAbi],
      address: contractAddress,
      functionName: currentFunctionAbi.name,
      args: currentFunctionAbi.inputs.length == 0 ? undefined : functionArgs,
    } satisfies ContractFunctionParameters;

    try {
      // read contract
      if (
        currentFunctionAbi.stateMutability == 'pure' ||
        currentFunctionAbi.stateMutability == 'view'
      ) {
        // output data
        return {
          [currentFunctionAbi.name]: await core.rpcProvider.readContract({
            ...params,
          }),
        };
      }

      // simulate contract
      await core.rpcProvider.simulateContract({
        ...params,
        account,
      });

      // write contract
      return {
        txHash: await core.web3Provider!.writeContract({
          ...params,
          chain: core.chain,
          account,
        }),
      };
    } catch (error) {
      throw new SDKError({
        code: ERROR_CODE.TRANSACTION_ERROR,
        error,
        message: (error as Error).message,
      });
    }
  }, [currentFunctionAbi, functionArgs, contractAddress]);

  return {
    currentFunctionAbi,
    setCurrentFunctionAbi,
    renderContractFunctionParamInput: renderInput,
    contractAddress,
    setContractAddress,
    executeFunctionCall,
  };
};
