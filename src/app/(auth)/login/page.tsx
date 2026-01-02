'use client';

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { generatePKCEPair } from '@/lib/utils/crypto';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

const generateAuthUrl = async () => {
  const AUTH_URL = 'https://connect.squareup.com/oauth2/authorize?';
  const APPLICATION_ID = 'sq0idp-HIISMUgQPS83S6m2EIB6wg';
  const pckePair = await generatePKCEPair();

  const params = new URLSearchParams({
    client_id: APPLICATION_ID,
    scope: 'CUSTOMERS_WRITE CUSTOMERS_READ',
    session: 'true',
    state: 'dGhpcyBpcyBhIsZSB0b2tljM0nTY3ODkw',
    code_challenge: pckePair.codeChallenge,
    redirect_uri: 'https://2h5qvc5l-3000.use2.devtunnels.ms/login',
  });

  return AUTH_URL + params.toString();
};

// https://2h5qvc5l-3000.use2.devtunnels.ms/?code=sq0cgp-8rzUiXDX76UUEfjoNwkGSA&response_type=code&state=dGhpcyBpcyBhIsZSB0b2tljM0nTY3ODkw#_=_

const redirectToSquareAuth = async () => {
  const authUrl = await generateAuthUrl();
  window.location.href = authUrl;
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  if (code) {
    console.log(code);

    const TOKEN_URL = 'https://connect.squareup.com/oauth2/token';
  }

  return (
    <section className='w-screen h-screen flex flex-col justify-center items-center gap-10'>
      <Image
        src='/santiago-taxes-square-logo.png'
        alt='Square Logo'
        width={270}
        height={270}
        preload
        style={{ objectFit: 'contain' }}
      />

      <form className='w-1/3'>
        <h1 className='text-purple font-semibold text-2xl text-center mb-4'>
          Login
        </h1>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='email' className='text-[15px]'>
              Email
            </FieldLabel>
            <Input
              id='email'
              type='text'
              placeholder='johndoe@santiagotaxes.com'
              className='p-3'
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='password' className='text-[15px]'>
              Password
            </FieldLabel>
            <Input
              id='password'
              type='password'
              className='p-3'
              placeholder='pwd1234'
            />
          </Field>
        </FieldGroup>

        <button
          onClick={redirectToSquareAuth}
          type='button'
          className='text-[15px] font-medium flex items-center gap-3 w-full justify-center border rounded-md p-3 mt-8 cursor-pointer hover:bg-muted'
        >
          Sign in with
          <Image
            src='/square-logo.png'
            alt='Square Logo'
            width={80}
            height={180}
            preload
            style={{ objectFit: 'contain' }}
          />
        </button>
      </form>

      <p className='text-[15px] text-neutral-500 mt-8'>
        Copyright © 2025 Santiago Professional Taxes. All rights reserved.
      </p>
    </section>
  );
}
