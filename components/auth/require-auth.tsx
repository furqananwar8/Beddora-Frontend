"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";

const PUBLIC_ROUTES = ["/", "/login", "/auth/callback", "/auth/error"];
const PROTECTED_PREFIXES = ["/dashboard"];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((route) => 
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(route + "/")
  );
}

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => 
    pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, isSuccess } = useUser();
  const processed = useRef(false);

  useEffect(() => {
    if (isLoading || processed.current) return;

    const isAuthenticated = isSuccess && !!data;

    // Guard: already on correct page, no redirect needed
    if (!isAuthenticated && isPublic(pathname)) {
      processed.current = true;
      return;
    }
    if (isAuthenticated && isProtected(pathname)) {
      processed.current = true;
      return;
    }

    if (isAuthenticated && isPublic(pathname)) {
      processed.current = true;
      router.replace("/dashboard/dayparting");
      return;
    }

    if (!isAuthenticated && isProtected(pathname)) {
      processed.current = true;
      router.replace("/");
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isSuccess, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const isAuthenticated = isSuccess && !!data;

  // Gate: wrong route → spinner until Next.js navigation completes
  if ((isAuthenticated && isPublic(pathname)) || (!isAuthenticated && isProtected(pathname))) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <AuthCheck>{children}</AuthCheck>
    </Suspense>
  );
}