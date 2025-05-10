# ATgeo Marker

Experimental app for markers to test Gazeteers + Geo lexicons. See [ATgeo
Experiments](https://wiki.atprotocol.community/en/working-groups/atgeo/experiments).

## Powered By

- [Tanstack Start](https://tanstack.com/start/latest)
- [Tailwind 4](https://tailwindcss.com/)
- [Shadcn/ui Components](https://ui.shadcn.com/docs)
- [lpm](https://github.com/lexicon-community/lpm)
- [@proto/lex-cli](https://www.npmjs.com/package/@atproto/lex-cli)
- [Gustopher](https://wiki.atprotocol.community/en/wiki/reference/community/lore/gustopher)

## How to Run

You'll need [pnpm](https://pnpm.io/) installed.
If you don't have node installed, you can install it with pnpm.

```
# to add node everywhere, add the --global flag to the commands below
pnpm env latest
pnpm env use latest
```

> [!WARNING]
>
> OAuth login will only run in localhost and will persist challenges and
> sessions to disk. Must be heavily updated for real production use.

### Getting Ready

0. Run `pnpm install`
1. Run `pnpx @atproto/lex-cli gen-api ./generated/api ./lexicons/**/*.json` to generate the Lexicons client code
2. Run `pnpx @atproto/lex-cli gen-server ./generated/server ./lexicons/**/*.json` to generate the Lexicons server code

### Running the client

3. Run `pnpm dev`
4. Go to `http://127.0.0.1/`

### Running the AppView

5. Add `MARKER_APPVIEW_DID` to your `.env` file. It should be of the form `did:web:a-reachable-url.com`
6. Run `pnpm run dev`

## Where to Go

- Main entrypoint is at [`src/routes/index.tsx`](./src/routes/index.tsx)
- Everything related to OAuth is in [`src/lib/auth.ts`](./src/lib/auth.ts)
  (stolen from simple local-only setup I had written previously)
- Login component is in [src/components/Login.tsx](./src/components/Login.tsx).
  There's no real validation logic.
- To log out, delete the `.tokens/` folder. And feel free to implement a real
  auth flow!

## Quality of Life Stuff

- You can add `DEFAULT_USER=your-pds-url` in `.env` to have the login automatically prefilled
- Install a new lexicon with `deno run jsr:@lpm/cli add path.to.lexicon.def` (needs deno)
