"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface NewsFormData {
  title: string;
  imageUrl?: string;
  imageCaption: string;
  content: string;
  sourceUrl: string;
}

interface NewsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewsFormData) => Promise<void>;
  error?: string | null;
}

export function NewsForm({ isOpen, onClose, onSubmit, error }: NewsFormProps) {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
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

    if (!image) {
      setUploadError("Please select an image");
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const imageUrl = await uploadImage(image);

      const formData: NewsFormData = {
        title,
        imageUrl,
        imageCaption,
        content,
        sourceUrl,
      };

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to create news post:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to create news post"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <div className="min-h-full w-full">
          <div className="flex min-h-full items-center justify-center">
            <Dialog.Panel className="relative mx-auto w-full max-w-2xl rounded-lg bg-white shadow-xl">
              <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
                <Dialog.Title className="text-2xl font-bold text-neutral-900">
                  Create News Post
                </Dialog.Title>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="max-h-[calc(85vh-8rem)] space-y-6 overflow-y-auto px-6 py-6">
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
                          <div className="mt-2 text-sm text-red-700">
                            {error}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Article Title */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Article Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter article title"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Article Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Article Image <span className="text-red-500">*</span>
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

                  {/* Image Caption */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Image Caption <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Enter image caption"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Article Thoughts */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Article Thoughts <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your thoughts about this article..."
                      rows={6}
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Source URL */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Article Source URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="Enter the source URL"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Form Actions - Fixed at bottom */}
                <div className="sticky bottom-0 border-t bg-white px-6 py-4">
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
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
