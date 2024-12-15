"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PostCategory } from "@prisma/client";
import type { BookFormData } from "@/lib/types";

interface BookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookFormData) => Promise<void>;
  error?: string | null;
}

export function BookForm({ isOpen, onClose, onSubmit, error }: BookFormProps) {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    setIsSubmitting(true);
    setUploadError(null);

    try {
      let coverImage: string | undefined;

      if (image) {
        coverImage = await uploadImage(image);
      }

      const formData: BookFormData = {
        title,
        authorName,
        content,
        purchaseUrl,
        coverImage,
        category: PostCategory.BOOKS,
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

      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <div className="min-h-full w-full">
          <div className="flex min-h-full items-center justify-center">
            <Dialog.Panel className="relative mx-auto w-full max-w-2xl rounded-lg bg-white shadow-xl">
              <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
                <Dialog.Title className="text-2xl font-bold text-neutral-900">
                  Share a Book
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

                  {/* Title */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Book Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter book title"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Book Cover Image
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
                        <div className="relative aspect-[3/4] w-48 overflow-hidden rounded-lg border">
                          <Image
                            src={imagePreview}
                            alt="Book cover preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Author Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Author Name(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Enter author name(s)"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Book Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write a description of the book..."
                      rows={6}
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Purchase URL */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Purchase URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={purchaseUrl}
                      onChange={(e) => setPurchaseUrl(e.target.value)}
                      placeholder="Enter purchase URL"
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
