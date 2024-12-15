"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PostImageProps {
  src: string;
  alt: string;
  className?: string;
}

function ImageSkeleton() {
  return (
    <div className="animate-pulse bg-neutral-200 w-full h-full absolute inset-0" />
  );
}

function ImageError() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
      <p className="text-sm text-neutral-500">Failed to load image</p>
    </div>
  );
}

export function PostImage({ src, alt, className }: PostImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-t-lg bg-neutral-100",
        className
      )}
    >
      {isLoading && <ImageSkeleton />}
      {hasError && <ImageError />}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover duration-700 ease-in-out",
          isLoading
            ? "scale-110 blur-2xl grayscale"
            : "scale-100 blur-0 grayscale-0"
        )}
        sizes="(min-width: 1280px) 784px, (min-width: 1040px) calc(65.83vw - 89px), (min-width: 780px) calc(100vw - 96px), calc(100vw - 32px)"
        priority={true}
        quality={75}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
