import { useSession, signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
}

export const useAuth = () => {
  const { data: session, status, update } = useSession();
  const queryClient = useQueryClient();

  const updateUserImage = async (imageUrl: string) => {
    // Update the session
    await update({
      ...session,
      user: {
        ...session?.user,
        image: imageUrl,
      },
    });

    // Update the auth query data
    queryClient.setQueryData(["auth"], (oldData: any) => {
      if (!oldData?.user) return oldData;
      return {
        ...oldData,
        user: {
          ...oldData.user,
          image: imageUrl,
        },
      };
    });
  };

  return {
    user: session?.user as User | undefined,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    updateUserImage,
    signOut,
  };
};
