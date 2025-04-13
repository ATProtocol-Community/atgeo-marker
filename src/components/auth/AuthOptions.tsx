"use client";

import { LoggedInUserOptions } from "./LoggedInUserOptions";
import { User } from "~/types/auth";
import { useRouter } from "@tanstack/react-router";

export default function AuthOptions({ user }: { user: User | null }) {
  const router = useRouter();

  // Don't display the login button if the user is already on the login page
  if (!user && router.matchRoute("/auth/login")) {
    return null;
  }

  if (!user)
    return (
      <div className="flex items-center justify-center">
        <button className="px-4 py-2 rounded-full text-sm lg:text-base relative no-underline duration-300 ease-in hover:text-zinc-800 dark:hover:text-zinc-100 text-zinc-700 dark:text-zinc-400">
          Login
        </button>
      </div>
    );
  return <LoggedInUserOptions user={user} />;
}
