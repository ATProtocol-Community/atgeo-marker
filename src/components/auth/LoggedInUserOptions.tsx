import { User } from "~/types/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { logoutUser } from "./Login";
import { useRouter } from "@tanstack/react-router";

export function LoggedInUserOptions({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center gap-2 w-max border rounded-full px-2 py-1 bg-accent">
        {user.avatar ? (
          <img
            className="max-h-8 rounded-full border w-full object-cover"
            src={user.avatar}
            alt={user.displayName}
          />
        ) : (
          <div className="max-h-10 rounded-full bg-gray-200 w-full" />
        )}
        <div className="overflow-clip whitespace-nowrap overflow-ellipsis max-w-32">
          {user.displayName || user.handle || user.did}
        </div>
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
  const router = useRouter();
  return (
    <form
      className="w-full h-full"
      method="POST"
      encType="multipart/form-data"
      action={logoutUser.url}
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await logoutUser({ data: formData });
        router.invalidate();
      }}
    >
      {/* hidden input with DID */}
      <input type="hidden" name="did" value={user.did} />
      <Button size="sm" variant="ghost" className="w-full block p-0 text-left">
        Log out
      </Button>
    </form>
  );
}
