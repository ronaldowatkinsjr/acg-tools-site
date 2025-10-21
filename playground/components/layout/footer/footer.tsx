import { Link } from '@lidofinance/lido-ui';
import { FC } from 'react';
import { FooterStyle } from './footerStyles';

const Footer: FC = () => (
  <FooterStyle size="full" forwardedAs="footer">
    <Link
      target="_blank"
      href="https://github.com/ronaldowatkinsjr/acg-tools-site"
    >
      Github Repository
    </Link>
  </FooterStyle>
);

export default Footer;
