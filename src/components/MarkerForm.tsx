import { createServerFn, json } from "@tanstack/react-start";
import { Input } from "./ui/input";
import { getLoggedInMarkerAgent } from "~/lib/auth";
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
import { useForm, useStore } from "@tanstack/react-form";
import { SafeParseReturnType, ZodError } from "zod";
import { countries, lookup } from "country-data-list";

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

export type MarkerView = {
  markerUri: string;
  label: string | undefined;
  location: string;
  markedEntries: string[] | undefined;
};

const postMarker = createServerFn({ method: "POST" })
  .validator(
    (
      data:
        | FormData
        | {
            label: string;
            location: string;
            markedEntries: string[];
          }
    ) => {
      const submittedData =
        data instanceof FormData ? Object.fromEntries(data.entries()) : data;
      const parsed = schemaMap.defs.main.record.safeParse({
        label: submittedData.label || undefined,
        location: {
          $type: "community.lexicon.location.address",
          country: submittedData.location,
        },
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

    // TODO: uncomment this if you want to really make a marker
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

    const countryName = countries.all.find(
      (country) => country.alpha2 === data.location.country
    )?.name!;
    let marker = {
      uri: "https://pdsls.dev/marker",
    };

    return {
      markerUri: marker.uri,
      label: data.label,
      location: countryName,
      markedEntries: data.markedEntries,
    };
  });

export function MarkerForm(props: {
  className?: string;
  onNewMarker: (response: MarkerView) => void;
}) {
  const form = useForm({
    defaultValues: {
      label: "",
      location: "",
      markedEntries: [""],
    },
    onSubmit: async ({ value }) => {
      const response = await postMarker({ data: value });
      props.onNewMarker(response);
      return response;
    },
    validators: {
      onSubmitAsync: async ({ value }) => {
        try {
          await postMarker({ data: value });
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
        form.handleSubmit();
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
            <>
              <CountryDropdown
                placeholder="Country"
                disabled={isSubmitting}
                onChange={(country) => {
                  field.handleChange(country.alpha2);
                }}
                className="!bg-gray-600"
              />
              <Input
                disabled={isSubmitting}
                type="hidden"
                name="location"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <div role="alert" className="text-red-500">
                  {field.state.meta.errors.join(", ")}
                </div>
              ) : null}
            </>
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
