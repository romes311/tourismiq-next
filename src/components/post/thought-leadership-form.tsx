"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

type MediaType = "image" | "video";
type VideoSource = "youtube" | "vimeo" | "twitter" | "linkedin";

interface ThoughtLeadershipFormData {
  mediaType: MediaType;
  title: string;
  content: string;
  imageUrl?: string;
  videoSource?: VideoSource;
  videoUrl?: string;
}

interface ThoughtLeadershipFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ThoughtLeadershipFormData) => Promise<void>;
  error?: string | null;
}

export function ThoughtLeadershipForm({
  isOpen,
  onClose,
  onSubmit,
  error,
}: ThoughtLeadershipFormProps) {
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [videoSource, setVideoSource] = useState<VideoSource>("youtube");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset any previous errors
      setUploadError(null);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }

      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image must be less than 5MB");
        return;
      }

      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaType === "image" && !image) {
      setUploadError("Please select an image");
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      let imageUrl: string | undefined;

      if (mediaType === "image" && image) {
        imageUrl = await uploadImage(image);
      }

      const formData: ThoughtLeadershipFormData = {
        mediaType,
        title,
        content,
        ...(mediaType === "image" ? { imageUrl } : { videoSource, videoUrl }),
      };

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to create post"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-2xl font-bold text-neutral-900">
            Create Thought Leadership Post
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error creating post
                    </h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Type Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Media Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType("image")}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium",
                    mediaType === "image"
                      ? "bg-primary text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("video")}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium",
                    mediaType === "video"
                      ? "bg-primary text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  Video
                </button>
              </div>
            </div>

            {/* Media Upload Section */}
            {mediaType === "image" ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Image
                </label>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {uploadError && (
                      <p className="text-sm text-red-500">{uploadError}</p>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Video Source
                  </label>
                  <select
                    value={videoSource}
                    onChange={(e) =>
                      setVideoSource(e.target.value as VideoSource)
                    }
                    className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Enter video URL"
                    className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={6}
                className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
