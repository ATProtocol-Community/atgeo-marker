// File that will dictate the behavior of TanStack Router used within Start.
// Here, you can configure everything from the default preloading functionality to caching staleness.
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    context: {
      user: null,
    },
    defaultErrorComponent: ({ error }) => (
      <main className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-red-500">Error: {error.message}</div>
      </main>
    ),
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
