// Entry point for all routes in the application.
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import appCss from "~/styles/app.css?url";
import Header from "~/components/Header";
import { ThemeProvider } from "~/lib/ThemeProvider";
import { getUser } from "~/components/Login";
import { User } from "~/types/auth";

export const Route = createRootRouteWithContext<{
  user: User | null;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "ATGeo Marker",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  beforeLoad: async () => {
    const user = await getUser();
    return { user: user ?? null };
  },
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: React.PropsWithChildren) {
  const { user } = Route.useRouteContext();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header user={user} />
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
