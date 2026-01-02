import { useMutation } from '@tanstack/react-query';
import { CLIENT_ID, OATH_URL } from '@/lib/consts';

// Types
export interface ExchangeCodeInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface SquareTokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  merchant_id: string;
  refresh_token?: string;
}

// API Functions
async function exchangeAuthorizationCode({
  code,
  codeVerifier,
  redirectUri,
}: ExchangeCodeInput): Promise<SquareTokenResponse> {
  const response = await fetch(`${OATH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

// Hooks
export function useExchangeAuthorizationCode() {
  return useMutation({
    mutationFn: exchangeAuthorizationCode,
  });
}
