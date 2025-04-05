import { createServerFn } from "@tanstack/react-start";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getLoggedInBskyAgent, loginToBsky } from "~/lib/auth";

const loginUser = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }
    const handle = formData.get("handle");
    if (!handle || typeof handle !== "string") {
      throw new Error("Invalid form data");
    }
    return { handle };
  })
  .handler(async ({ data }) => {
    const agent = await getLoggedInBskyAgent({ handle: data.handle });
    if (!agent) {
      const url = await loginToBsky({ user: data.handle });
      // Cannot throw redirect here because of the following issue:
      // https://github.com/TanStack/router/issues/3820
      throw new Response("ok", { status: 302, headers: { Location: url } });
    }

    // If login is successful, redirect to the home page
    throw new Response("ok", { status: 302, headers: { Location: "/" } });
  });

export function Login() {
  return (
    <main className="flex h-screen flex-col items-center justify-center w-full">
      <form
        className="flex flex-col w-md mx-auto gap-2"
        action={loginUser.url}
        method="POST"
        encType="multipart/form-data"
      >
        <Input
          type="text"
          placeholder="goosetopher.bsky.social"
          defaultValue={"essentialrandom.bsky.social"}
          name="handle"
        />
        <Button>Login with ATproto</Button>
      </form>
    </main>
  );
}
