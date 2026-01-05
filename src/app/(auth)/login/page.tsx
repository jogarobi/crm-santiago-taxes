'use client';

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useState } from 'react';
import { authClient } from '@/app/api/clients';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
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

      <form className='w-1/3 pb-5' onSubmit={handleSubmit}>
        <h1 className='text-purple font-semibold text-2xl text-center mb-8'>
          Welcome back
        </h1>

        <FieldGroup>
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
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                className='p-3 pr-12'
                placeholder='Enter your password'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
                }}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className='w-4.5 h-4.5' />
                ) : (
                  <Eye className='w-4.5 h-4.5' />
                )}
              </button>
            </div>
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
          disabled={loading || !email || !password}
        >
          {loading && <Loader2 className='w-6 h-6 animate-spin text-white' />}
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {error && (
          <p className='text-red-600 text-[15px] font-medium text-center mt-6'>
            {error}
          </p>
        )}
      </form>

      <p className='text-[15px] text-neutral-500 mt-8'>
        Copyright © 2025 Santiago Professional Taxes. All rights reserved.
      </p>
    </section>
  );
}
