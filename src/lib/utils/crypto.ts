export function generateCryptoRandomString(length: number = 128): string {
  if (length < 43 || length > 128) {
    throw new Error('Length must be between 43 and 128 characters (inclusive)');
  }

  const unreservedChars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const charsetLength = unreservedChars.length;

  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += unreservedChars[randomValues[i] % charsetLength];
  }

  return result;
}

export function generatePKCECodeVerifier(length: number = 128): string {
  return generateCryptoRandomString(length);
}

export type CodeChallengeMethod = 'S256' | 'plain';

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a PKCE code challenge from a code verifier.
 *
 * Supports two transformation methods:
 * - S256 (recommended): BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
 * - plain: code_challenge = code_verifier
 *
 * S256 is Mandatory To Implement (MTI) and should be used unless there are
 * technical constraints. The plain method is only for compatibility with
 * existing deployments or constrained environments.
 *
 * @param codeVerifier - The code verifier string
 * @param method - The transformation method ('S256' or 'plain'). Defaults to 'S256'
 * @returns A promise that resolves to the code challenge string
 */
export async function generatePKCECodeChallenge(
  codeVerifier: string,
  method: CodeChallengeMethod = 'S256'
): Promise<string> {
  if (method === 'plain') {
    return codeVerifier;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return base64UrlEncode(hash);
}

export async function generatePKCEPair(
  verifierLength: number = 128,
  method: CodeChallengeMethod = 'S256'
): Promise<{
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
}> {
  const codeVerifier = generatePKCECodeVerifier(verifierLength);
  const codeChallenge = await generatePKCECodeChallenge(codeVerifier, method);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: method,
  };
}
