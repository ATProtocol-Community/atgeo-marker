import { User } from "~/types/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { createServerFn } from "@tanstack/react-start";
import { logoutFromBsky } from "~/lib/auth";
import { Button } from "../ui/button";

export function LoggedInUserOptions({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center gap-2 w-max border rounded-full px-2 py-1 bg-accent">
        {user.avatar ? (
          <img
            className="max-h-8 rounded-full border w-full"
            src={user.avatar}
            alt={user.displayName}
          />
        ) : (
          <div className="max-h-10 rounded-full bg-gray-200 w-full" />
        )}
        <div>{user.displayName || user.handle || user.did}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutOptions user={user} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LogoutOptions({ user }: { user: User }) {
  return (
    <form className="" method="POST" encType="multipart/form-data">
      {/* hidden input with DID */}
      <input type="hidden" name="did" value={user.did} />
      <Button size="sm" variant="ghost" className="p-0">
        Log out
      </Button>
    </form>
  );
}
