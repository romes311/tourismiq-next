"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { EventFormData } from "@/lib/types";

interface EventsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  error?: string | null;
}

export function EventsForm({
  isOpen,
  onClose,
  onSubmit,
  error,
}: EventsFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(
    null
  );
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [hostCompany, setHostCompany] = useState("");
  const [hostCompanyLogo, setHostCompanyLogo] = useState<File | null>(null);
  const [hostCompanyLogoPreview, setHostCompanyLogoPreview] = useState<
    string | null
  >(null);
  const [eventLocation, setEventLocation] = useState("");
  const [additionalDetailsUrl, setAdditionalDetailsUrl] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isLogo: boolean = false
  ) => {
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

      if (isLogo) {
        setHostCompanyLogo(file);
        const previewUrl = URL.createObjectURL(file);
        setHostCompanyLogoPreview(previewUrl);
      } else {
        setEventImage(file);
        const previewUrl = URL.createObjectURL(file);
        setEventImagePreview(previewUrl);
      }
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
      let imageUrl: string | undefined;
      let logoUrl: string | undefined;

      if (eventImage) {
        imageUrl = await uploadImage(eventImage);
      }

      if (hostCompanyLogo) {
        logoUrl = await uploadImage(hostCompanyLogo);
      }

      const formData: EventFormData = {
        title,
        content,
        imageUrl,
        eventStartDate,
        eventEndDate,
        hostCompany,
        hostCompanyLogo: logoUrl,
        eventLocation,
        additionalDetailsUrl,
        registrationUrl: registrationUrl || undefined,
      };

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to create event post:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to create event post"
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
                  Create Event Post
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

                  {/* Event Title */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter event title"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Event Promo Image */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Event Promo Image
                    </label>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e)}
                          className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {uploadError && (
                          <p className="text-sm text-red-500">{uploadError}</p>
                        )}
                      </div>
                      {eventImagePreview && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                          <Image
                            src={eventImagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        Event Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        Event End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Host Company */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Host Company/Organization{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hostCompany}
                      onChange={(e) => setHostCompany(e.target.value)}
                      placeholder="Enter host company or organization name"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Host Company Logo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Host Company/Organization Logo
                    </label>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, true)}
                          className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      {hostCompanyLogoPreview && (
                        <div className="relative h-20 w-40 overflow-hidden rounded-lg border">
                          <Image
                            src={hostCompanyLogoPreview}
                            alt="Company Logo Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Location */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Event Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Enter event location"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Event Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Event Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter event description"
                      rows={6}
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Additional Details Link */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Additional Details Link (URL){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={additionalDetailsUrl}
                      onChange={(e) => setAdditionalDetailsUrl(e.target.value)}
                      placeholder="Enter URL for additional details"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Registration Link */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Registration Link (URL)
                    </label>
                    <input
                      type="url"
                      value={registrationUrl}
                      onChange={(e) => setRegistrationUrl(e.target.value)}
                      placeholder="Enter registration URL (optional)"
                      className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      {isSubmitting ? "Creating..." : "Create Event"}
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
