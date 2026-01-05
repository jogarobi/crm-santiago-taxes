import { SquareClient, SquareEnvironment } from 'square';
import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { ac, roles } from '@/lib/permissions';

export const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles,
    }),
  ],
});
