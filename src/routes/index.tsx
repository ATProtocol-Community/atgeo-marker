import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getUser, Login } from "~/components/Login";

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return parseInt(getCookie("marker-count") ?? "0");
});

const updateCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await getCount();
    const newCount = count + data;
    setCookie("marker-count", newCount.toString());

    return newCount;
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const user = await getUser();
    if (!user) {
      return undefined;
    }
    return {
      user,
      count: await getCount(),
    };
  },
});

function Home() {
  const state = Route.useLoaderData();
  const router = useRouter();

  if (state === undefined) {
    // redirect to /auth/login
    return <Navigate to="/auth/login" />;
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div>Hello {state.user.handle}</div>
      <div>You have made {state.count} markers</div>
      <AlertDialog>
        <AlertDialogTrigger className="bg-primary text-primary-foreground rounded-md px-4 py-2">
          Make a Marker
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you ready to mark your record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is still experimental
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                updateCount({ data: 1 }).then(() => {
                  router.invalidate();
                });
              }}
            >
              Marker time!!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
