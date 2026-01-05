'use client';

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useState } from 'react';
import { authClient } from '@/app/api/clients';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setValidationErrors({});

    const validationResult = loginSchema.safeParse({ email, password });

    if (!validationResult.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    const { error } = await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: '/',
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          router.push('/');
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );

    if (error) {
      setError(error.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError(null);
    setValidationErrors({});

    const validationResult = signupSchema.safeParse({ email, password, name });

    if (!validationResult.success) {
      const errors: Partial<Record<keyof SignupFormData, string>> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof SignupFormData] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    const { error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: '/',
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          router.push('/');
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoading(false);
        },
      }
    );

    if (error) {
      setError(error.message || 'An error occurred during signup');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin();
    } else {
      handleSignup();
    }
  };

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

      <form className='w-1/3' onSubmit={handleSubmit}>
        <h1 className='text-purple font-semibold text-2xl text-center mb-8'>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>

        <FieldGroup>
          {mode === 'signup' && (
            <Field>
              <FieldLabel htmlFor='name' className='text-[15px]'>
                Name
              </FieldLabel>
              <Input
                id='name'
                type='text'
                placeholder='John Doe'
                className='p-3'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
              {validationErrors.name && (
                <p className='text-red-600 text-sm mt-1'>
                  {validationErrors.name}
                </p>
              )}
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor='email' className='text-[15px]'>
              Email
            </FieldLabel>
            <Input
              id='email'
              type='email'
              placeholder='johndoe@santiagotaxes.com'
              className='p-3'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            {validationErrors.email && (
              <p className='text-red-600 text-sm mt-1'>
                {validationErrors.email}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor='password' className='text-[15px]'>
              Password
            </FieldLabel>
            <Input
              id='password'
              type='password'
              className='p-3'
              placeholder={
                mode === 'signup'
                  ? 'Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number'
                  : 'Enter your password'
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationErrors((prev) => ({
                  ...prev,
                  password: undefined,
                }));
              }}
            />
            {validationErrors.password && (
              <p className='text-red-600 text-sm mt-1'>
                {validationErrors.password}
              </p>
            )}
          </Field>
        </FieldGroup>

        <button
          type='submit'
          className='text-[15px] font-medium flex items-center gap-3 w-full justify-center border rounded-md p-3 mt-8 cursor-pointer bg-purple hover:bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={
            loading || !email || !password || (mode === 'signup' && !name)
          }
        >
          {loading && <Loader2 className='w-6 h-6 animate-spin text-white' />}

          {loading
            ? mode === 'login'
              ? 'Logging in...'
              : 'Creating account...'
            : mode === 'login'
            ? 'Login'
            : 'Sign up'}
        </button>

        {error && (
          <p className='text-red-600 text-[15px] font-medium text-center mt-6'>
            {error}
          </p>
        )}

        <p className='text-center text-[15px] text-neutral-600 mt-6'>
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type='button'
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setValidationErrors({});
                }}
                className='text-purple font-semibold hover:underline'
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type='button'
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setValidationErrors({});
                }}
                className='text-purple font-semibold hover:underline'
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </form>

      <p className='text-[15px] text-neutral-500 mt-8'>
        Copyright © 2025 Santiago Professional Taxes. All rights reserved.
      </p>
    </section>
  );
}
