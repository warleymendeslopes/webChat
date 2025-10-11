"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface SafeRedirectProps {
  to: string;
  condition: boolean;
  loading?: boolean;
}

export default function SafeRedirect({
  to,
  condition,
  loading = false,
}: SafeRedirectProps) {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || hasRedirected.current) return;

    if (condition) {
      hasRedirected.current = true;
      console.log(`🔄 Safe redirect to: ${to}`);
      router.replace(to);
    }
  }, [to, condition, loading, router]);

  return null;
}
