import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/listings/vip(.*)',
]);

// Define routes that are only accessible to logged-in users (registered tier)
const isRegisteredRoute = createRouteMatcher([
  '/listings/registered(.*)',
  '/properties/(.*)' // Property detail pages require registration
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect VIP and dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // For registered routes, check if user is authenticated
  if (isRegisteredRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Redirect to sign-in if not authenticated
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Temporarily disable middleware to debug deployment issues
    // Skip Next.js internals and all static files, unless found in search params
    // '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    // '/(api|trpc)(.*)',
  ],
};