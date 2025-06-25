import { createServerFn, json } from "@tanstack/react-start";
import { Input } from "../ui/input";
import { getLoggedInMarkerAgent } from "~/lib/auth";
import { lexiconToZod } from "lexicon-to-zod";
// TODO: swap with the generated lexicon
import geomarkerLexicon from "~/lexicons/community/atprotocol/geomarker.json" with { type: "json" };
import addressLexicon from "~/lexicons/community/lexicon/location/address.json" with { type: "json" };
import geoLexicon from "~/lexicons/community/lexicon/location/geo.json" with { type: "json" };
import fsqLexicon from "~/lexicons/community/lexicon/location/fsq.json" with { type: "json" };
import hthreeLexicon from "~/lexicons/community/lexicon/location/hthree.json" with { type: "json" };
import { type Record as MarkerRecord } from "~/generated/api/types/community/atprotocol/geomarker/marker";
import { getUser } from "../auth/Login";
import { Button } from "../ui/button";
import { useStore } from "@tanstack/react-form";
import { SafeParseReturnType, z, ZodError } from "zod";
import { MarkerView } from "~/generated/api/types/community/atprotocol/geomarker/defs";
import {
  isMain as isAddressMain,
  Main as AddressMain,
} from "~/generated/server/types/community/lexicon/location/address";
import { toAtUri } from "~/lib/uris";
import { GazeteerLocation, LocationSearch } from "./LocationSearch";
import { useAppForm, fieldContext } from "./LocationForm";
import { CommunityLexiconLocationAddress } from "~/generated/api";
import { CommunityLexiconLocationHthree } from "~/generated/api";
import { CommunityLexiconLocationFsq } from "~/generated/api";

const lexiconDict = {
  [geomarkerLexicon.id]: geomarkerLexicon,
  [addressLexicon.id]: addressLexicon,
  [geoLexicon.id]: geoLexicon,
  [fsqLexicon.id]: fsqLexicon,
  [hthreeLexicon.id]: hthreeLexicon,
};
const schemaMap = lexiconToZod(lexiconDict[geomarkerLexicon.id], {
  lexiconDict,
  followRefs: true,
});

const isAddress = (location: unknown): location is AddressMain => {
  return isAddressMain(location);
};


type MarkerFormData = {
  label: string;
  markedEntries: string[];
  location: Pick<GazeteerLocation, "location" | "sourceUri"> | undefined;
}

const postMarker = createServerFn({ method: "POST" })
  .validator(
    (
      data:
        | FormData
        | MarkerFormData
    ) => {
      const submittedData =
        data instanceof FormData ? Object.fromEntries(data.entries()) as unknown as MarkerFormData : data ;
      const parsed = schemaMap.defs.main.record.safeParse({
        label: submittedData.label || undefined,
        location: submittedData.location?.location,
        locationSource: submittedData.location?.sourceUri,
        markedEntries: submittedData.markedEntries,
      }) as SafeParseReturnType<unknown, MarkerRecord>;

      if (!parsed.success) {
        throw json(
          {
            errors: parsed.error.errors,
          },
          { status: 400 }
        );
      }

      return {
        label: parsed.data.label,
        location: parsed.data.location,
        locationSource: parsed.data.locationSource,
        markedEntries: parsed.data.markedEntries,
      };
    }
  )
  .handler(async ({ data }): Promise<MarkerView> => {
    const user = await getUser();
    if (!user) {
      throw new Error("User not found");
    }

    const markerAgent = await getLoggedInMarkerAgent({ handle: user.handle });
    if (!markerAgent) {
      throw new Error("Failed to get marker agent");
    }

    const markedAtUris = await Promise.all(
      (data.markedEntries ?? [])
        .filter((entry) => entry.trim())
        .map(async (entry) => {
          const atUri = await toAtUri(entry);
          if (!atUri) {
            throw new Error("Failed to convert entry to atUri");
          }
          return atUri;
        })
    );

    const marker =
      await markerAgent.community.atprotocol.geomarker.marker.create(
        {
          repo: user.did,
        },
        {
          label: data.label as string,
          location: data.location,
          locationSource: data.locationSource,
          markedEntries: markedAtUris,
        }
      );

    return {
      uri: marker.uri,
      label: data.label,
      location: data.location,
      markedEntries: markedAtUris.map((uri) => ({
        $type: "community.atprotocol.geomarker.defs#entryView",
        uri: uri,
      })),
    };
  });

export function MarkerForm(props: {
  className?: string;
  onNewMarker: (response: MarkerView) => void;
  userDid: string;
}) {
  const form = useAppForm({
    defaultValues: {
      label: "",
      markedEntries: [""],
      location: undefined as MarkerFormData["location"]
    },
    validators: {
      onSubmit: z.any(),
      onSubmitAsync: async ({ value }) => {
        try {
          const response = await postMarker({ data: value });
          props.onNewMarker(response);
          return response;
        } catch (error) {
          if (!("errors" in (error as any))) {
            return { form: "Failed to make marker" };
          }
          const fieldsResponse = {
            fields: (error as ZodError).errors.reduce(
              (acc, error) => {
                acc[error.path[0]] = error.message;
                return acc;
              },
              {} as Record<string, string>
            ),
          };
          return fieldsResponse;
        }
      },
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form
      className="flex flex-col w-md mx-auto gap-2"
      action={postMarker.url}
      method="POST"
      encType="multipart/form-data"
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-2  bg-gray-800 px-2 py-4 rounded-md">
        <div>Label your marker (optional)</div>
        <form.Field name="label">
          {(field) => (
            <Input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isSubmitting}
              type="text"
              placeholder="Label"
              className="!bg-gray-600"
            />
          )}
        </form.Field>
        <div>Choose a location</div>
        <form.Field name="location">
          {(field) => (
            <fieldContext.Provider value={field}>
              <LocationSearch prefix={field.name} userDid={props.userDid} />
            </fieldContext.Provider>
          )}
        </form.Field>
        <form.Field name="markedEntries" mode="array">
          {(field) => (
            <div className="flex flex-col  gap-2">
              <div>Mark your entries! (optional)</div>
              {field.state.value.map((value, index) => (
                <div key={index} className="flex items-center gap-2 w-full">
                  <Input
                    className="!bg-gray-600"
                    disabled={isSubmitting}
                    type="text"
                    placeholder="Marked Entry"
                    name="markedEntries"
                    value={value}
                    onChange={(e) =>
                      field.handleChange((prev) => {
                        const newArray = [...prev];
                        newArray[index] = e.target.value;
                        return newArray;
                      })
                    }
                  />
                  <Button
                    className="ml-auto"
                    type="button"
                    onClick={() => field.removeValue(index)}
                  >
                    🗑️
                  </Button>
                </div>
              ))}
              <Button
                className="max-w-xs self-end"
                type="button"
                onClick={() => field.pushValue("")}
              >
                ➕
              </Button>
            </div>
          )}
        </form.Field>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Making Marker..." : "Make Marker"}
      </Button>
    </form>
  );
}
