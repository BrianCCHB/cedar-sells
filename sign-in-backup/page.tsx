// Sign In page - Cedar Sells

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access exclusive investment properties
          </p>
        </div>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/listings"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-cedar-green hover:bg-cedar-dark-green',
              footerActionLink: 'text-cedar-green hover:text-cedar-dark-green'
            }
          }}
        />
      </div>
    </div>
  );
}