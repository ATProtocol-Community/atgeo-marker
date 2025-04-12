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
import { setCookie } from "@tanstack/react-start/server";
import { getCookie } from "@tanstack/react-start/server";
import { useState } from "react";
import { MarkerForm } from "~/components/MarkerForm";

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
    return {
      count: await getCount(),
    };
  },
});

function Home() {
  const { user } = Route.useRouteContext();
  const state = Route.useLoaderData();
  const [markers, setMarkers] = useState<string[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);

  if (!user) {
    // redirect to /auth/login
    return <Navigate to="/auth/login" reloadDocument />;
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div>Hello {user.handle}</div>
      <div>You have made {state.count} markers</div>
      <div>Hello {user.handle}</div>
      <div>You have made these markers:</div>
      {markers.map((marker) => (
        <div key={marker}>
          <a href={`https://pdsls.dev/${marker}`}>{marker}</a>
        </div>
      ))}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
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
          <MarkerForm
            formId="marker-form"
            onNewMarker={(uri) => {
              setMarkers([...markers, uri]);
              setAlertOpen(false);
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                // Dispatch a submit event to the form
                // TODO: remove this once the form is not in the dialog anymore
                document
                  .querySelector<HTMLFormElement>("#marker-form")
                  ?.dispatchEvent(
                    new Event("submit", { bubbles: true, cancelable: true })
                  );
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
