"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/auth/client";

export function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const user = await getSessionUser();

        if (!mounted) return;

        if (!user) {
          const qs = typeof window !== "undefined" ? window.location.search : "";
          const nextPath = `${pathname}${qs}`;
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        setIsAuthed(true);
      } catch {
        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (isChecking) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <div className="rounded-fairy bg-white p-6 text-sm text-fairy-ink/80 shadow-fairy">요정이 로그인 상태를 확인하고 있어요...</div>
      </main>
    );
  }

  if (!isAuthed) {
    return null;
  }

  return children;
}
