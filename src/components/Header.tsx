import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Library, Map, MapPin } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AuthOptions from "./auth/AuthOptions";
import { User } from "~/types/auth";

const navItems = [
  {
    path: "/",
    el: (
      <div className="flex gap-2 items-center">
        <MapPin /> Marker
      </div>
    ),
    inactiveColor: "text-zinc-900 dark:text-zinc-400",
  },
  {
    path: "/map",
    el: (
      <div className="flex gap-2 items-center">
        <Map className="w-5 h-6" />
        <div className="max-w-0 md:max-w-full overflow-clip transition-all">
          Map
        </div>
      </div>
    ),
  },
];

export default function Header({ user }: { user: User | null }) {
  const { location } = useRouterState();
  let pathname = location.pathname;

  return (
    <div className="container max-w-screen w-full sticky top-4 items-center flex justify-center z-10">
      <div className="backdrop-blur-xl lg:max-w-5xl w-full border border-stone-800/90 overflow-hidden rounded-full z-100 bg-background/50 shadow-inner shadow-stone-200 dark:shadow-stone-800 *:transition-colors mx-2">
        <div className="flex items-center justify-between w-full p-[0.4rem] noisey rounded-full z-10">
          <nav className="flex relative justify-start w-full z-100 rounded-full">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);

              return (
                <div
                  key={item.path}
                  className="flex items-center justify-center"
                >
                  <Link
                    className={`px-4 py-2 rounded-full text-sm lg:text-base relative no-underline duration-300 ease-in hover:text-zinc-800 dark:hover:text-zinc-100 text-zinc-700 dark:text-zinc-400`}
                    to={item.path}
                    data-active={isActive}
                  >
                    <div>{item.el}</div>
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="flex gap-2 items-center">
            <AuthOptions user={user} />
            <ThemeToggle className="rounded-full hover:dark:bg-stone-600/50 hover:bg-stone-300/50 mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
