import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Login } from "~/components/Login";

export const Route = createFileRoute("/auth/login/")({
  component: LoginView,
  loader: async () => {
    return {
      defaultHandle: process.env.DEFAULT_USER,
    };
  },
});

function LoginView() {
  const { user } = Route.useRouteContext();
  const { defaultHandle } = Route.useLoaderData();

  if (user) {
    return <Navigate to="/" reloadDocument />;
  }

  return (
    <div>
      <Login defaultHandle={defaultHandle} />
    </div>
  );
}
