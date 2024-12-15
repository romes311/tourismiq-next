import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
}

export const useAuth = () => {
  const { data: session, status } = useSession();

  return {
    user: session?.user as User | undefined,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
};
