import { ERROR_CODE, SDKError } from '@a42n-olympus/ark-dao-sdk';
import {
  Accordion,
  Input,
  Option,
  Select,
  Textarea,
} from '@lidofinance/lido-ui';
import { Action } from 'components/action';
import { ActionBlock, Controls } from 'components/action/styles';
import { BondDepositDemo } from 'demo/bond-deposit';
import { BondRedeemDemo } from 'demo/bond-redeem';
import { StakeClaimDemo } from 'demo/stake-claim';
import { StakeDepositDemo } from 'demo/stake-deposit';
import { supportedChains } from 'env-dynamics.mjs';
import { useArkSDK } from 'providers/sdk';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import {
  Abi,
  AbiFunction,
  AbiParameter,
  Address,
  ContractFunctionName,
  ContractFunctionParameters,
  getAbiItem,
  zeroAddress,
} from 'viem';

export const ArbitaryFunctionCallDemo = () => {
  const { account: web3account = '0x0', chainId } = useWeb3();
  const account = web3account as `0x${string}`;

  // set contract abi
  const [inputContractAbi, setInputContractAbi] = useState<string>('');
  const [currentContractAbi, setCurrentContractAbi] = useState<Abi>();
  const [selectedFunctionName, setSelectedFunctionName] = useState<string>(); // for display purposes only

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
  const BUILT_IN_CONTRACT_FUNCTIONS = useMemo(() => {
    // return {} for unsupported chains
    if (!chainId || !supportedChains.includes(chainId)) {
      return {};
    }

    // return def
    return {
      [bondDeposit.getContractOlyV3Operator().address.toLowerCase()]: {
        eligibleFunctions: ['bondPurchase__V3'],
        ui: [<BondDepositDemo />],
      },
      [bondDeposit.getContractOlyV3BondFixedTermTeller().address.toLowerCase()]:
        {
          eligibleFunctions: ['redeem__V3'],
          ui: [<BondRedeemDemo />],
        },
      [bondDeposit.getContractOlyV3VARKVault().address.toLowerCase()]: {
        eligibleFunctions: ['deposit__V3', 'withdraw__V3'],
        ui: [<StakeDepositDemo />, <StakeClaimDemo />],
      },
    } satisfies {
      [key: string]: {
        eligibleFunctions: ContractFunctionName<typeof ABI, 'nonpayable'>[];
        ui: ReactNode[];
      };
    } as {
      [key: string]: { eligibleFunctions: string[]; ui: ReactNode[] };
    };
  }, [
    bondDeposit.getContractOlyV3Operator().address,
    bondDeposit.getContractOlyV3BondFixedTermTeller().address,
    bondDeposit.getContractOlyV3VARKVault().address,
    chainId,
  ]);

  return (
    <>
      <Accordion summary="Set Contract Address" defaultExpanded>
        <Action
          walletAction
          title="Set Contract Address"
          action={async () => {}}
        >
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
      <Accordion summary="Set Contract ABI" defaultExpanded>
        <Action
          walletAction
          title="Set Contract ABI"
          action={async () => {
            try {
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

                // reset function call section
                setSelectedFunctionName(undefined);
                setCurrentFunctionAbi(undefined);

                // output current abi
                return parsedAbi;
              } else {
                // abi is invalid
                throw new SDKError({
                  code: ERROR_CODE.INVALID_ARGUMENT,
                  message: 'Invalid ABI Input',
                });
              }
            } catch (error) {
              throw new SDKError({
                code: ERROR_CODE.INVALID_ARGUMENT,
                message: 'Invalid JSON input',
              });
            }
          }}
        >
          <Textarea
            rows={10}
            label="Contract ABI"
            value={inputContractAbi}
            onChange={(event) => setInputContractAbi(event.target.value)}
          />
        </Action>
      </Accordion>
      <Accordion summary="Contract Function Call" defaultExpanded>
        <ActionBlock>
          <Controls>
            {/* function dropdown */}
            <Select
              label="Contract Function Name"
              value={selectedFunctionName}
              onChange={(functionName) => {
                setSelectedFunctionName(functionName as string);

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
            walletAction
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
  const { account: web3account = zeroAddress, chainId } = useWeb3();
  const account = web3account as `0x${string}`;

  useEffect(() => {
    // reset functionArgs
    setFunctionArgs([]);
  }, [currentFunctionAbi]);

  const renderInput = (
    <FunctionParamInput
      abiInputs={currentFunctionAbi ? currentFunctionAbi.inputs : []}
      functionArgs={functionArgs}
      onUpdateFunctionArgs={async (updatedArgs) => setFunctionArgs(updatedArgs)}
    />
  );

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
  }, [currentFunctionAbi, functionArgs, contractAddress, chainId]);

  return {
    currentFunctionAbi,
    setCurrentFunctionAbi,
    renderContractFunctionParamInput: renderInput,
    contractAddress,
    setContractAddress,
    executeFunctionCall,
  };
};

function FunctionParamInput({
  argsPath = [],
  abiInputs,
  functionArgs,
  onUpdateFunctionArgs,
}: {
  abiInputs: readonly AbiParameter[];
  functionArgs: any[];
  onUpdateFunctionArgs: (updatedFunctionArgs: any[]) => Promise<void>;
  argsPath?: any[];
}) {
  const handleChange = useCallback(
    (inputValue: any, argPath: any[], type: string) => {
      const updatedArgs = structuredClone(functionArgs);

      // Traverse the nested path to assign the value
      let target = updatedArgs;
      for (let i = 0; i < argPath.length - 1; i++) {
        if (target[argPath[i]] == undefined) target[argPath[i]] = [];
        target = target[argPath[i]];
      }

      const uintType = type.match(/^uint(\d+)$/);
      if (uintType && Number(uintType[1]) <= 48) {
        target[argPath[argPath.length - 1]] = Number(inputValue);
      } else if (uintType && Number(uintType[1]) > 48) {
        target[argPath[argPath.length - 1]] = BigInt(inputValue);
      } else {
        target[argPath[argPath.length - 1]] = inputValue;
      }

      onUpdateFunctionArgs(updatedArgs);
    },
    [functionArgs],
  );

  return (
    <>
      {abiInputs.map((input, index) => {
        const key = [...argsPath, index].join('-');
        const currentArgsPath = [...argsPath, index];

        // Recurse nested struct
        if (input.type.startsWith('tuple')) {
          return (
            <FunctionParamInput
              abiInputs={
                (
                  input as Extract<
                    AbiParameter,
                    { components: readonly AbiParameter[] }
                  >
                ).components
              }
              functionArgs={functionArgs}
              onUpdateFunctionArgs={onUpdateFunctionArgs}
              argsPath={currentArgsPath}
            />
          );
        }

        // array input, use comma-separated value
        if (input.type.endsWith('[]')) {
          return (
            <Input
              label={`${input.name} (comma-separated)`}
              onChange={(e) =>
                handleChange(
                  e.target.value.split(','),
                  currentArgsPath,
                  input.type,
                )
              }
            />
          );
        }

        // primitive input
        return (
          <Input
            key={key}
            label={`${input.name} (${input.type})`}
            type={input.type.startsWith('uint') ? 'number' : 'text'}
            onChange={(e) =>
              handleChange(e.target.value, currentArgsPath, input.type)
            }
          />
        );
      })}
    </>
  );
}
