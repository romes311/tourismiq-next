"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            Something went wrong!
          </h1>
          <p className="text-neutral-600 mt-2 mb-6">
            {error.message || "Failed to load profile"}
          </p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
