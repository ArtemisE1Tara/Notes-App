import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/shared/(.*)",
  "/settings(.*)",
  // Make sure to include the webhooks route as public
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isPublic(req)) {
    return;
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};



