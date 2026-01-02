'use client';

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useExchangeAuthorizationCode } from '@/hooks/use-square-auth';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const description = searchParams.get('error_description');

  const { mutate: exchangeCode } = useExchangeAuthorizationCode();

  useEffect(() => {
    const existingCode = localStorage.getItem('code_verifier');
    const existingChallenge = localStorage.getItem('code_challenge');

    if (code && existingCode && existingChallenge) {
      exchangeCode(
        {
          code,
          codeVerifier: existingCode,
          redirectUri: process.env.NEXT_PUBLIC_SQUARE_REDIRECT_URI!,
        },
        {
          onSuccess: (data) => {
            console.log('TOKEN RESPONSE', data);
          },
          onError: (error) => {
            console.error('Failed to exchange authorization code:', error);
          },
          onSettled: () => {
            localStorage.removeItem('code_verifier');
            localStorage.removeItem('code_challenge');
          },
        }
      );
    }
  }, [code, exchangeCode]);

  return (
    <section className='w-screen h-screen flex flex-col justify-center items-center gap-10'>
      <Image
        src='/santiago-taxes-square-logo.png'
        alt='Square Logo'
        width={230}
        height={230}
        preload
        style={{ objectFit: 'contain' }}
      />

      <form className='w-1/3'>
        <h1 className='text-purple font-semibold text-2xl text-center mb-4'>
          Hello!
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
          type='button'
          className='text-[15px] font-medium flex items-center gap-3 w-full justify-center border rounded-md p-3 mt-8 cursor-pointer bg-purple hover:bg-primary text-white'
        >
          Login
        </button>

        {/*         <button
          onClick={handleAuthRedirect}
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
        </button> */}

        {error && description && (
          <p className='text-red-600 text-[15px] font-medium text-center mt-6'>
            There has been an error: {error}, {description}
          </p>
        )}
      </form>

      <p className='text-[15px] text-neutral-500 mt-8'>
        Copyright © 2025 Santiago Professional Taxes. All rights reserved.
      </p>
    </section>
  );
}
