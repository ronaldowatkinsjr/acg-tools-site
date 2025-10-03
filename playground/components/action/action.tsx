import dynamic from 'next/dynamic';

const ReactJSON = dynamic(() => import('react-json-view'), {
  ssr: false,
});

import { type SDKError } from '@a42n-olympus/ark-dao-sdk';
import { Accordion, Button } from '@lidofinance/lido-ui';
import { PropsWithChildren, useReducer } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import {
  ActionBlock,
  Controls,
  ErrorMessage,
  ResultCode,
  SuccessMessage,
} from './styles';

type ActionProps<TResult> = PropsWithChildren<{
  action: () => Promise<TResult> | TResult;
  title: string;
  renderResult?: (result: TResult) => React.JSX.Element;
  renderError?: (error: SDKError) => React.JSX.Element;
  walletAction?: boolean;
  disableAction?: boolean;
  buttonColor?:
    | 'secondary'
    | 'primary'
    | 'error'
    | 'warning'
    | 'success'
    | undefined;
}>;

type ReducerAction<TResult> =
  | {
      type: 'loading';
    }
  | {
      type: 'error';
      error: SDKError;
    }
  | {
      type: 'success';
      result: TResult;
    }
  | {
      type: 'reset';
    };

type ReducerState<TResult> = {
  loading: boolean;
  error: SDKError | undefined;
  result: TResult | undefined;
};

const reducer = <TResult,>(
  state: ReducerState<TResult>,
  action?: ReducerAction<TResult>,
): ReducerState<TResult> => {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case 'loading':
      return {
        error: undefined,
        result: undefined,
        loading: true,
      };
    case 'error':
      return {
        error: action.error,
        result: undefined,
        loading: false,
      };
    case 'success':
      return {
        error: undefined,
        result: action.result,
        loading: false,
      };
    case 'reset':
      return {
        error: undefined,
        result: undefined,
        loading: false,
      };
  }
};

const defaultRenderError = (error: SDKError) => {
  return (
    <Accordion
      summary={
        <ErrorMessage>
          {error.code}:{String(error.errorMessage).slice(0, 30) + '...'}
        </ErrorMessage>
      }
    >
      <ErrorMessage>{String(error.errorMessage)}</ErrorMessage>
    </Accordion>
  );
};

export const defaultRenderResult = <TResult,>(result: TResult) => {
  const stringfyed = JSON.stringify(
    result,
    (_, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );

  if (typeof result !== 'object') {
    return <ResultCode>{stringfyed}</ResultCode>;
  }
  return (
    <Accordion summary={<SuccessMessage>Success</SuccessMessage>}>
      <ReactJSON
        theme={'pop'}
        name={null}
        displayDataTypes={false}
        src={JSON.parse(stringfyed)}
        collapseStringsAfterLength={30}
      />
    </Accordion>
  );
};

export const Action = <TResult,>({
  action,
  title,
  walletAction = false,
  disableAction = false,
  renderResult = defaultRenderResult,
  renderError = defaultRenderError,
  children,
  buttonColor,
}: ActionProps<TResult>) => {
  const { active } = useWeb3();
  const [{ result, error, loading }, dispatch] = useReducer(
    reducer<TResult>,
    {
      error: undefined,
      result: undefined,
      loading: false,
    },
    reducer,
  );

  const startLoading = async () => {
    try {
      dispatch({ type: 'loading' });
      const result = await action();
      dispatch({ type: 'success', result });
    } catch (error) {
      console.error(error);
      dispatch({ type: 'error', error: error as SDKError });
    }
  };

  return (
    <ActionBlock>
      {children && <Controls>{children}</Controls>}
      <Controls>
        <Button
          disabled={disableAction || (walletAction && !active)}
          loading={loading}
          onClick={startLoading}
          color={buttonColor}
        >
          {title}
        </Button>
        {result !== undefined && renderResult(result)}
        {!!error && renderError(error)}
      </Controls>
    </ActionBlock>
  );
};
