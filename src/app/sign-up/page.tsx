// Sign Up page - Cedar Cash Home Buyers

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">
            Join Cedar Cash Home Buyers
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Get access to exclusive investment properties in Lafayette and Baton Rouge
          </p>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/listings"
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