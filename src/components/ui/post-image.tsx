"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface PostImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PostImage({ src, alt, className }: PostImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-t-lg bg-neutral-100",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width: 1280px) 784px, (min-width: 1040px) calc(65.83vw - 89px), (min-width: 780px) calc(100vw - 96px), calc(100vw - 32px)"
      />
    </div>
  );
}
