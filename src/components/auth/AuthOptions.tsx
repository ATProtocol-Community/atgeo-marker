"use client";

import { useState, useEffect } from "react";
import { getUser } from "../Login";
import { Loader, LoaderContainer } from "../ui/loader";
import { LoggedInUserOptions } from "./LoggedInUserOptions";

export default function AuthOptions() {
  // TODO: user type
  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      fetchUser();
    }
  }, []);

  if (isLoading || typeof window === "undefined") return <Loader />;

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
