import { createServerFn } from "@tanstack/react-start";
import { Input } from "./ui/input";
import {
  getLoggedInBskyAgent,
  getLoggedInMarkerAgent,
  loginToBsky,
} from "~/lib/auth";
import { useFormStatus } from "react-dom";
import { lexiconToZod } from "lexicon-to-zod";
// TODO: swap with the generated lexicon
import geomarkerLexicon from "~/lexicons/community/atprotocol/geomarker.json" with { type: "json" };
import addressLexicon from "~/lexicons/community/lexicon/location/address.json" with { type: "json" };
import geoLexicon from "~/lexicons/community/lexicon/location/geo.json" with { type: "json" };
import fsqLexicon from "~/lexicons/community/lexicon/location/fsq.json" with { type: "json" };
import hthreeLexicon from "~/lexicons/community/lexicon/location/hthree.json" with { type: "json" };
import { type Record as MarkerRecord } from "~/generated/api/types/community/atprotocol/geomarker/marker";
import { cn } from "~/lib/utils";
import { getUser } from "./auth/Login";
import { Country, CountryDropdown } from "./CountryDropdown";
import { useState, useCallback } from "react";
import { Button } from "./ui/button";

const schemaMap = lexiconToZod(geomarkerLexicon);

const postMarker = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }
    console.log("formData", formData);
    const parsed = schemaMap.defs.main.record.parse(
      {
        label: formData.get("label") || undefined,
        location: {
          $type: "community.lexicon.location.address",
          country: formData.get("location"),
        },
        markedEntries: formData.getAll("markedEntries"),
      },
      {
        followRefs: true,
        lexiconDict: {
          [geomarkerLexicon.id]: geomarkerLexicon.defs.main,
          [addressLexicon.id]: addressLexicon.defs.main,
          [geoLexicon.id]: geoLexicon.defs.main,
          [fsqLexicon.id]: fsqLexicon.defs.main,
          [hthreeLexicon.id]: hthreeLexicon.defs.main,
        },
      }
    ) as MarkerRecord;
    return {
      label: parsed.label,
      location: parsed.location,
      markedEntries: parsed.markedEntries,
    };
  })
  .handler(async ({ data }) => {
    const user = await getUser();
    if (!user) {
      throw new Error("User not found");
    }
    const agent = await getLoggedInBskyAgent({ handle: user.handle });
    if (!agent) {
      const url = await loginToBsky({ user: user.handle });
      // Cannot throw redirect here because of the following issue:
      // https://github.com/TanStack/router/issues/3820
      throw new Response("ok", { status: 302, headers: { Location: url } });
    }

    const markerAgent = await getLoggedInMarkerAgent({ handle: user.handle });
    if (!markerAgent) {
      throw new Error("Failed to get marker agent");
    }

    // const marker =
    //   await markerAgent.community.atprotocol.geomarker.marker.create(
    //     {
    //       repo: user.did,
    //     },
    //     {
    //       label: data.label as string,
    //       location: data.location as string,
    //       markedEntries: [data.markedEntries as string],
    //     }
    //   );

    let marker = {
      uri: "https://pdsls.dev/marker",
    };
    console.dir(marker, { depth: null });

    return { marker: marker.uri };
  });

export function MarkerForm(props: {
  className?: string;
  formId: string;
  onNewMarker: (uri: string) => void;
}) {
  const { pending } = useFormStatus();
  const [location, setLocation] = useState<string | undefined>(undefined);

  console.log("pending", pending);
  return (
    <main
      className={cn(
        "flex flex-col items-center justify-center w-full",
        props.className
      )}
    >
      <form
        id={props.formId}
        className="flex flex-col w-md mx-auto gap-2"
        action={postMarker.url}
        method="POST"
        encType="multipart/form-data"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const response = await postMarker({ data: formData });
          props.onNewMarker(response.marker);
        }}
      >
        <Input
          disabled={pending}
          type="text"
          placeholder="Label"
          name="label"
        />
        <CountryDropdown
          placeholder="Country"
          disabled={pending}
          onChange={(country) => {
            setLocation(country.name);
          }}
        />
        <Input
          disabled={pending}
          type="hidden"
          name="location"
          value={location ?? ""}
        />
        <Input
          disabled={pending}
          type="text"
          placeholder="Marked Entries"
          name="markedEntries"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Making Marker..." : "Make Marker"}
        </Button>
      </form>
    </main>
  );
}
