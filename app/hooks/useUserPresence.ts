"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useCallback, useEffect } from "react";

import { api } from "@/convex/_generated/api";

export function useUserPresence() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const createUser = useMutation(api.users.createUser);
  const updateUserStatus = useMutation(api.users.updateUserStatus);

  useEffect(() => {
    if (!user) return;

    void createUser({
      clerkId: user.id,
      name: user.fullName || "No Name",
      email: user.primaryEmailAddress?.emailAddress || "",
      image: user.imageUrl,
    }).then(() => updateUserStatus({ clerkId: user.id, isOnline: true }));
  }, [createUser, updateUserStatus, user]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!user) return;
      await updateUserStatus({ clerkId: user.id, isOnline: false });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [updateUserStatus, user]);

  const handleSignOut = useCallback(async () => {
    if (user) {
      await updateUserStatus({ clerkId: user.id, isOnline: false });
    }

    await signOut();
  }, [signOut, updateUserStatus, user]);

  return {
    user,
    handleSignOut,
  };
}
