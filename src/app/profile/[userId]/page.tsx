"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserPosts } from "@/hooks/use-user-posts";
import type { UserProfileResponse } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/post/post-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImageCropModal } from "@/components/profile/image-crop-modal";
import { useSession } from "next-auth/react";
import { signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
type Tab =
  | "about"
  | "posts"
  | "connections"
  | "messages"
  | "comments"
  | "bookmarks"
  | "qa"
  | "score";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const isOwnProfile = currentUser?.id === userId;

  // Set active tab from URL parameter
  useEffect(() => {
    if (tabParam && tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${window.location.pathname}?${params.toString()}`);

    // Refetch connections data when switching to connections tab
    if (tab === "connections") {
      queryClient.invalidateQueries({
        queryKey: ["pending-connections", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["accepted-connections", userId],
      });
    }
  };

  const [formData, setFormData] = useState<{
    name: string;
    businessName: string;
    location: string;
    bio: string;
    occupation: string;
    canPostCDME: boolean;
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  }>({
    name: "",
    businessName: "",
    location: "",
    bio: "",
    occupation: "",
    canPostCDME: false,
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: profile, isLoading: isLoadingProfile } =
    useQuery<UserProfileResponse>({
      queryKey: ["profile", userId],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        return response.json();
      },
    });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.user.name || "",
        businessName: profile.user.businessName || "",
        location: profile.user.location || "",
        bio: profile.user.bio || "",
        occupation: profile.user.occupation || "",
        canPostCDME: profile.user.canPostCDME || false,
        facebook: profile.user.socialLinks?.facebook || "",
        twitter: profile.user.socialLinks?.twitter || "",
        linkedin: profile.user.socialLinks?.linkedin || "",
        instagram: profile.user.socialLinks?.instagram || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update auth data in cache
      queryClient.setQueryData(["auth"], (oldData: any) => {
        if (!oldData?.user) return oldData;
        return {
          ...oldData,
          user: {
            ...oldData.user,
            name: data.user.name,
            businessName: data.user.businessName,
          },
        };
      });

      // Invalidate and refetch all necessary queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["user-posts", userId] }),
      ]);

      setIsEditing(false);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    fetchNextPage,
    hasNextPage,
  } = useUserPosts(userId as string);

  // Add connection queries
  const { data: pendingConnections } = useQuery({
    queryKey: ["pending-connections", userId],
    queryFn: async () => {
      console.log("Fetching pending connections for userId:", userId);
      const response = await fetch(
        `/api/users/${userId}/connections?status=PENDING`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch pending connections");
      }
      const data = await response.json();
      console.log("Pending connections data:", data);
      return data;
    },
    enabled:
      isOwnProfile &&
      (activeTab === "connections" || tabParam === "connections"),
    refetchInterval: activeTab === "connections" ? 5000 : false, // Refetch every 5 seconds when on connections tab
  });

  const { data: acceptedConnections } = useQuery({
    queryKey: ["accepted-connections", userId],
    queryFn: async () => {
      console.log("Fetching accepted connections for userId:", userId);
      const response = await fetch(
        `/api/users/${userId}/connections?status=ACCEPTED`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch accepted connections");
      }
      const data = await response.json();
      console.log("Accepted connections data:", data);
      return data;
    },
    enabled: activeTab === "connections" || tabParam === "connections",
    refetchInterval: activeTab === "connections" ? 5000 : false, // Refetch every 5 seconds when on connections tab
  });

  const tabs: { id: Tab; label: string; notification?: number }[] = [
    { id: "about", label: "About" },
    { id: "posts", label: "Posts" },
    {
      id: "connections",
      label: "Connections",
      notification:
        isOwnProfile && pendingConnections?.received?.length > 0
          ? pendingConnections.received.length
          : undefined,
    },
    { id: "messages", label: "Messages" },
    { id: "comments", label: "Comments" },
    { id: "bookmarks", label: "Bookmarks" },
    { id: "qa", label: "Q&A" },
    { id: "score", label: "Score" },
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert(
        "Image size is too large. Please choose a smaller image (max 4MB)."
      );
      return;
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", croppedImageBlob, "profile-image.jpg");

      const response = await fetch(`/api/users/${userId}/profile/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { imageUrl, user: updatedUser } = await response.json();
      console.log("Received updated user:", updatedUser);

      // Update the session with the new image
      await updateSession({
        user: {
          ...session?.user,
          image: imageUrl,
        },
      });

      // Update the profile query data
      queryClient.setQueryData(["profile", userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          user: {
            ...oldData.user,
            image: imageUrl,
          },
        };
      });

      // Update all posts queries to reflect the new image
      queryClient.setQueriesData({ queryKey: ["posts"] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((post: any) =>
              post.author.id === userId
                ? {
                    ...post,
                    author: {
                      ...post.author,
                      image: imageUrl,
                    },
                  }
                : post
            ),
          })),
        };
      });

      // Update user posts query
      queryClient.setQueriesData(
        { queryKey: ["user-posts", userId] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((post: any) => ({
                ...post,
                author: {
                  ...post.author,
                  image: imageUrl,
                },
              })),
            })),
          };
        }
      );

      // Invalidate and refetch all necessary queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["user-posts", userId] }),
        queryClient.invalidateQueries({ queryKey: ["auth"] }),
      ]);

      setCropModalOpen(false);
      setSelectedImage(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      // You might want to show a toast notification here
    }
  };

  // Add connection status query
  const { data: connectionStatus } = useQuery({
    queryKey: ["connection-status", userId],
    queryFn: async () => {
      if (!currentUser || currentUser.id === userId) return null;
      try {
        const response = await fetch(`/api/users/${userId}/connection`);
        if (response.status === 400) {
          console.error("Invalid user ID for connection status");
          return null;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch connection status");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching connection status:", error);
        return null;
      }
    },
    enabled: !!currentUser && currentUser.id !== userId,
  });

  // Add connection mutations
  const sendConnectionRequest = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(`/api/users/${userId}/connection`, {
          method: "POST",
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to send connection request");
        }
        return response.json();
      } catch (error) {
        console.error("Error sending connection request:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connection-status", userId],
      });
    },
  });

  const handleConnectionAction = useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: string;
      action: "accept" | "reject";
    }) => {
      const response = await fetch(`/api/users/${userId}/connection`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${action} connection request`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-connections", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["accepted-connections", userId],
      });
    },
  });

  // Add delete connection mutation
  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`/api/users/${userId}/connection`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionId }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete connection");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accepted-connections", userId],
      });
    },
  });

  const renderConnectionButton = () => {
    if (!currentUser || currentUser.id === userId) return null;

    if (!connectionStatus) {
      return (
        <Button
          onClick={() => sendConnectionRequest.mutate()}
          disabled={sendConnectionRequest.isPending}
          variant="outline"
        >
          {sendConnectionRequest.isPending ? "Sending..." : "Add Connection"}
        </Button>
      );
    }

    switch (connectionStatus.status) {
      case "PENDING":
        if (connectionStatus.senderId === currentUser.id) {
          return (
            <Button variant="outline" disabled>
              Connection Request Sent
            </Button>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                handleConnectionAction.mutate({
                  userId: connectionStatus.senderId,
                  action: "accept",
                })
              }
              disabled={handleConnectionAction.isPending}
            >
              Accept
            </Button>
            <Button
              onClick={() =>
                handleConnectionAction.mutate({
                  userId: connectionStatus.senderId,
                  action: "reject",
                })
              }
              disabled={handleConnectionAction.isPending}
              variant="outline"
            >
              Decline
            </Button>
          </div>
        );
      case "ACCEPTED":
        return (
          <Button variant="outline" disabled>
            Connected
          </Button>
        );
      case "REJECTED":
        return (
          <Button
            onClick={() => sendConnectionRequest.mutate()}
            disabled={sendConnectionRequest.isPending}
            variant="outline"
          >
            Add Connection
          </Button>
        );
      default:
        return null;
    }
  };

  if (isLoadingProfile || isLoadingPosts) {
    return (
      <div className="animate-pulse">
        <div className="px-4 lg:px-8">
          <div className="p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 bg-neutral-200 rounded-full" />
              <div className="flex-1">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          Profile not found
        </h1>
        <p className="text-neutral-600 mt-2">
          The profile you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <div className="space-y-8">
            {/* Personal & Professional Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              {(isEditing || profile.user.name) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-xl font-semibold text-neutral-900">
                      Personal Information
                    </h2>
                  </div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.user.name && (
                        <div className="group">
                          <Label className="text-sm font-medium text-neutral-500">
                            Name
                          </Label>
                          <p className="text-lg text-neutral-900">
                            {profile.user.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Professional Information */}
              {(isEditing ||
                profile.user.occupation ||
                profile.user.businessName ||
                profile.user.location) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-xl font-semibold text-neutral-900">
                      Professional Information
                    </h2>
                  </div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="occupation"
                          className="text-sm font-medium"
                        >
                          Job Title
                        </Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              occupation: e.target.value,
                            }))
                          }
                          className="transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="businessName"
                          className="text-sm font-medium"
                        >
                          Company/Organization
                        </Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              businessName: e.target.value,
                            }))
                          }
                          className="transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="location"
                          className="text-sm font-medium"
                        >
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                          className="transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.user.occupation && (
                        <div className="group">
                          <Label className="text-sm font-medium text-neutral-500">
                            Job Title
                          </Label>
                          <p className="text-lg text-neutral-900">
                            {profile.user.occupation}
                          </p>
                        </div>
                      )}
                      {profile.user.businessName && (
                        <div className="group">
                          <Label className="text-sm font-medium text-neutral-500">
                            Company/Organization
                          </Label>
                          <p className="text-lg text-neutral-900">
                            {profile.user.businessName}
                          </p>
                        </div>
                      )}
                      {profile.user.location && (
                        <div className="group">
                          <Label className="text-sm font-medium text-neutral-500">
                            Location
                          </Label>
                          <p className="text-lg text-neutral-900">
                            {profile.user.location}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bio Section */}
            {(isEditing || profile.user.bio) && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Bio
                  </h2>
                </div>
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                    className="transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-lg text-neutral-700 whitespace-pre-wrap">
                    {profile.user.bio}
                  </p>
                )}
              </div>
            )}

            {/* Social Links */}
            {(isEditing ||
              profile.user.socialLinks?.facebook ||
              profile.user.socialLinks?.twitter ||
              profile.user.socialLinks?.linkedin ||
              profile.user.socialLinks?.instagram) && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Social Links
                  </h2>
                </div>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-sm font-medium">
                        Facebook URL
                      </Label>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facebook: e.target.value,
                          }))
                        }
                        className="transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-sm font-medium">
                        Twitter URL
                      </Label>
                      <Input
                        id="twitter"
                        value={formData.twitter}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            twitter: e.target.value,
                          }))
                        }
                        className="transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm font-medium">
                        LinkedIn URL
                      </Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            linkedin: e.target.value,
                          }))
                        }
                        className="transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="instagram"
                        className="text-sm font-medium"
                      >
                        Instagram URL
                      </Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            instagram: e.target.value,
                          }))
                        }
                        className="transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.user.socialLinks?.facebook && (
                      <a
                        href={profile.user.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-neutral-700 hover:text-primary transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span>Facebook</span>
                      </a>
                    )}
                    {profile.user.socialLinks?.twitter && (
                      <a
                        href={profile.user.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-neutral-700 hover:text-primary transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        <span>Twitter</span>
                      </a>
                    )}
                    {profile.user.socialLinks?.linkedin && (
                      <a
                        href={profile.user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-neutral-700 hover:text-primary transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profile.user.socialLinks?.instagram && (
                      <a
                        href={profile.user.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-neutral-700 hover:text-primary transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                        </svg>
                        <span>Instagram</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex justify-end space-x-4">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="px-6"
                    >
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="px-6">
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      case "posts":
        return (
          <div className="space-y-6">
            {postsData?.pages.map((page, i) => (
              <div key={i} className="space-y-6">
                {page.items.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ))}
            {hasNextPage && (
              <div className="text-center">
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        );
      case "connections":
        return (
          <div className="space-y-8">
            {/* Pending Connections Section */}
            {isOwnProfile && pendingConnections?.received?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Pending Requests ({pendingConnections.received.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {pendingConnections.received.map((connection: any) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Image
                          src={
                            connection.sender.image ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${connection.sender.name}`
                          }
                          alt={connection.sender.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                        <div>
                          <Link
                            href={`/profile/${connection.sender.id}`}
                            className="font-medium text-neutral-900 hover:text-primary"
                          >
                            {connection.sender.name}
                          </Link>
                          <p className="text-sm text-neutral-500">
                            Sent{" "}
                            {new Date(
                              connection.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            handleConnectionAction.mutate({
                              userId: connection.sender.id,
                              action: "accept",
                            })
                          }
                          disabled={handleConnectionAction.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() =>
                            handleConnectionAction.mutate({
                              userId: connection.sender.id,
                              action: "reject",
                            })
                          }
                          disabled={handleConnectionAction.isPending}
                          variant="outline"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connections Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-xl font-semibold text-neutral-900">
                  Connections ({acceptedConnections?.connections?.length || 0})
                </h2>
              </div>
              {acceptedConnections?.connections?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {acceptedConnections.connections.map((connection: any) => {
                    const connectedUser =
                      connection.sender.id === userId
                        ? connection.receiver
                        : connection.sender;
                    return (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Image
                            src={
                              connectedUser.image ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${connectedUser.name}`
                            }
                            alt={connectedUser.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                          <div>
                            <Link
                              href={`/profile/${connectedUser.id}`}
                              className="font-medium text-neutral-900 hover:text-primary"
                            >
                              {connectedUser.name}
                            </Link>
                            <p className="text-sm text-neutral-500">
                              Connected{" "}
                              {new Date(
                                connection.updatedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              deleteConnection.mutate(connection.id)
                            }
                            disabled={deleteConnection.isPending}
                          >
                            {deleteConnection.isPending ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Removing...
                              </span>
                            ) : (
                              "Remove"
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-600 text-center">
                  No connections yet.
                </p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-neutral-600">This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Profile content */}
      <div className="px-4 lg:px-8">
        {/* Profile header */}
        <div className="p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <Image
                src={
                  profile.user.image ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    isEditing ? formData.name : profile.user.name
                  }`
                }
                alt={isEditing ? formData.name : profile.user.name || "Profile"}
                width={128}
                height={128}
                className={cn(
                  "rounded-full border-4 border-white shadow-lg",
                  isEditing && "opacity-85 transition-opacity"
                )}
              />
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <label
                    htmlFor="profile-image"
                    className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer hover:bg-black/30 transition-colors"
                  >
                    <span className="sr-only">Change profile photo</span>
                    <div className="bg-black/50 p-2 rounded-full">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="file"
                      id="profile-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                {isEditing ? formData.name : profile.user.name}
              </h1>
              <p className="text-lg text-neutral-600">
                {isEditing ? formData.occupation : profile.user.occupation}
                {isEditing
                  ? formData.businessName && ` • ${formData.businessName}`
                  : profile.user.businessName &&
                    ` • ${profile.user.businessName}`}
              </p>
              {(isEditing ? formData.location : profile.user.location) && (
                <p className="text-neutral-600 mt-1">
                  📍 {isEditing ? formData.location : profile.user.location}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">{renderConnectionButton()}</div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-neutral-600 hover:text-primary"
                )}
              >
                {tab.label}
                {tab.notification && (
                  <span className="absolute top-2 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
                    {tab.notification}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="py-6">{renderTabContent()}</div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
