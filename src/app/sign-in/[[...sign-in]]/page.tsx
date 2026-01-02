import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className='w-screen h-screen grid place-items-center'>
      <SignIn />
    </div>
  );
}
