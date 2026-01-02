import { CLIENT_ID, OATH_URL, SquarePermission } from '../consts';
import { generatePKCEPair } from './crypto';

export const handleAuthRedirect = async () => {
  const existingCode = localStorage.getItem('code_verifier');
  const existingChallenge = localStorage.getItem('code_challenge');

  if (!existingCode && !existingChallenge) {
    const { codeChallenge, codeVerifier } = await generatePKCEPair();

    localStorage.setItem('code_verifier', codeVerifier);
    localStorage.setItem('code_challenge', codeChallenge);
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: [
      SquarePermission.APPOINTMENTS_ALL_READ,
      SquarePermission.APPOINTMENTS_WRITE,
      SquarePermission.CUSTOMERS_READ,
      SquarePermission.EMPLOYEES_READ,
      SquarePermission.ITEMS_READ,
      SquarePermission.PAYMENTS_READ,
      SquarePermission.ORDERS_READ,
      SquarePermission.APPOINTMENTS_WRITE,
    ].join(' '),
    session: 'true',
    state: 'dGhpcyBpcyBhIsZSB0b2tljM0nTY3ODkw',
    code_challenge: existingChallenge!,
    redirect_uri: process.env.NEXT_PUBLIC_SQUARE_REDIRECT_URI!,
  });

  const AUTH_URL = OATH_URL + '/authorize?' + params.toString();
  window.location.href = AUTH_URL;
};
