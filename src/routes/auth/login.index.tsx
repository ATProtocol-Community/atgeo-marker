import { createFileRoute } from "@tanstack/react-router";
import { Login } from "~/components/Login";

export const Route = createFileRoute("/auth/login/")({
  component: LoginView,
});

function LoginView() {
  return (
    <div>
      <Login />
    </div>
  );
}
