import { Button, ButtonProps, toast } from '@lidofinance/lido-ui';
import { useAuth } from 'extends/frontend/src/providers/auth-provider';
import { FC } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import { useSignMessage } from 'wagmi';

const BEAuthSignIn: FC<ButtonProps> = (props) => {
  const { onClick, ...rest } = props;
  const {
    authenticate,
    currentStep,
    authData,
    address: authAddress,
  } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const { account: web3account = '0x0' } = useWeb3();

  return (
    <Button
      onClick={() => {
        authenticate('check-address-and-nonce').then(() => {
          authenticate('verify-captcha').then(async () => {
            // sign in
            if (currentStep == 'sign') {
              // ensure authData populated
              if (!authData) {
                throw new Error(`authData undefined: ${authData}`);
              }
              if (!authData.nonce) {
                throw new Error(`authData.nonce undefined: ${authData}`);
              }

              // verify connected wallet address matches the one from auth provider
              if (!web3account || !authAddress) {
                throw new Error(
                  `web3account or authAddress undefined:\nweb3account:${web3account}\nauthAddress:${authAddress}`,
                );
              }
              if (web3account.toLowerCase() != authAddress.toLowerCase()) {
                throw new Error(`web3account doesnt match authAddress`);
              }

              // sign message
              const signature = await signMessageAsync({
                message: authData.nonce,
              });
              const authPayload: any = {
                signature,
                web3account,
              };

              // authenticate
              await authenticate('authenticate', authPayload);
            }

            // disable sign in for new user
            if (currentStep == 'referral') {
              toast('for new user, please register in the main app', {
                type: 'error',
              });
            }
          });
        });
      }}
      {...rest}
    >
      Connect
    </Button>
  );
};

export default BEAuthSignIn;
