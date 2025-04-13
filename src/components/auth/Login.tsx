import { createServerFn } from "@tanstack/react-start";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { getLoggedInBskyAgent, loginToBsky, logoutFromBsky } from "~/lib/auth";
import { useSession } from "@tanstack/react-start/server";
import { getEvent } from "@tanstack/react-start/server";
import { useFormStatus } from "react-dom";

const SESSION_STORE_PASSWORD = "i too am a friend of goosetopher";

export const createNewUserSession = async ({ did }: { did: string }) => {
  const event = getEvent();
  const session = await useSession(event, {
    password: SESSION_STORE_PASSWORD,
  });
  await session.update({
    did,
  });
  return session;
};

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const event = getEvent();
  const session = await useSession(event, {
    password: SESSION_STORE_PASSWORD,
  });

  if (!session.data.did) {
    return undefined;
  }
  const agent = await getLoggedInBskyAgent({
    did: session.data.did,
  });

  if (!agent) {
    return undefined;
  }
  const user = await agent.getProfile({
    actor: session.data.did,
  });

  return user.success
    ? {
        handle: user.data.handle,
        did: user.data.did,
        displayName: user.data.displayName,
        avatar: user.data.avatar,
      }
    : undefined;
});

export const logoutUser = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }
    const did = formData.get("did");
    if (!did || typeof did !== "string") {
      throw new Error("Invalid form data");
    }
    return { did };
  })
  .handler(async ({ data }) => {
    await logoutFromBsky({ did: data.did });
    return { success: true };
  });

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
    if (!agent || !agent.did) {
      const url = await loginToBsky({ user: data.handle });

      // Cannot throw redirect here because of the following issue:
      // https://github.com/TanStack/router/issues/3820
      throw new Response("ok", { status: 302, headers: { Location: url } });
    }
    // If login is successful, redirect to the home page
    const session = await createNewUserSession({ did: agent.did });
    throw new Response("ok", { status: 302, headers: { Location: "/" } });
  });

export function Login({ defaultHandle }: { defaultHandle?: string }) {
  const { pending } = useFormStatus();
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
          placeholder="gustophergoose.bsky.social"
          name="handle"
          defaultValue={defaultHandle}
          disabled={pending}
        />
        <Button disabled={pending}>Login with ATproto</Button>
      </form>
    </main>
  );
}
