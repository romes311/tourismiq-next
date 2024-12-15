"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { VideoSource } from "@/lib/types";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface VideoEmbedProps {
  url: string;
  videoSource: VideoSource;
}

export function VideoEmbed({ url, videoSource }: VideoEmbedProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widgets script if needed
    if (videoSource === "twitter") {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = () => {
        if (containerRef.current && url.includes("<blockquote")) {
          initializeTweet();
        }
      };
      document.body.appendChild(script);
    }
  }, [videoSource, url]);

  // Platform-specific configurations
  const config = {
    youtube: {
      playerVars: {
        modestbranding: 1,
        showinfo: 0,
        rel: 0,
        iv_load_policy: 3,
      },
    },
    vimeo: {
      playerOptions: {
        byline: false,
        portrait: false,
        title: false,
        transparent: true,
      },
    },
    facebook: {
      appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    },
  };

  const initializeTweet = () => {
    if (!containerRef.current || !url.includes("<blockquote")) return;

    // Clear previous content
    containerRef.current.innerHTML = url;

    if (window.twttr?.widgets) {
      window.twttr.widgets
        .load(containerRef.current)
        .then(() => {
          setIsLoading(false);
          setError(null);
        })
        .catch((error: Error) => {
          console.error("Error loading tweet:", error);
          setError(
            "Failed to load tweet. Please check the embed code and try again."
          );
          setIsLoading(false);
        });
    }
  };

  useEffect(() => {
    if (videoSource === "twitter") {
      initializeTweet();
    } else {
      // For non-Twitter embeds, we'll handle loading state differently
      setIsLoading(false);
    }
  }, [url, videoSource]);

  if (videoSource === "twitter") {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-neutral-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <p className="text-center text-sm text-red-500">{error}</p>
          </div>
        )}
        <div ref={containerRef} className="flex justify-center" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-center text-sm text-red-500">{error}</p>
        </div>
      )}
      <div className="absolute inset-0">
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls
          playing={false}
          onError={(e) => {
            console.error(`Error loading ${videoSource} video:`, e);
            setError(
              `Unable to load ${videoSource} video. Please check the URL and try again.`
            );
          }}
          onReady={() => {
            setIsLoading(false);
            setError(null);
          }}
          config={config}
          fallback={
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-neutral-500">Loading video...</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
