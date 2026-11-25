import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicRoute(request)) {
    return;
  }

  const isDevelopmentPreview =
    process.env.NODE_ENV === "development" &&
    process.env.GUIAME_HOY_PREVIEW === "true" &&
    (request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/hoy" ||
      request.nextUrl.pathname.startsWith("/hoy/"));
  if (isDevelopmentPreview) {
    return;
  }

  if (!(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
