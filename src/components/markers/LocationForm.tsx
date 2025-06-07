import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import {
  CommunityLexiconLocationAddress,
  CommunityLexiconLocationFsq,
  CommunityLexiconLocationHthree,
} from "~/generated/api";
import { Input } from "../ui/input";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Address Field Component
export const AddressLexiconForm = () => {
  const field = useFieldContext<CommunityLexiconLocationAddress.Main>();
  const value = field.state.value;

  return (
    <>
      <Input
        type="hidden"
        name={`${field.name}.$type`}
        value="community.lexicon.location.address"
      />
      <Input type="hidden" name={`${field.name}.name`} value={value.name} />
      <Input type="hidden" name={`${field.name}.region`} value={value.region} />
      <Input type="hidden" name={`${field.name}.street`} value={value.street} />
      <Input
        type="hidden"
        name={`${field.name}.country`}
        value={value.country}
      />
      <Input
        type="hidden"
        name={`${field.name}.locality`}
        value={value.locality}
      />
      <Input
        type="hidden"
        name={`${field.name}.postalCode`}
        value={value.postalCode}
      />
    </>
  );
};

// H3 Field Component
export const HthreeLexiconForm = () => {
  const field = useFieldContext<CommunityLexiconLocationHthree.Main>();
  const value = field.state.value;

  return (
    <>
      <Input
        type="hidden"
        name={`${field.name}.$type`}
        value="community.lexicon.location.hthree"
      />
      <Input type="hidden" name={`${field.name}.name`} value={value.name} />
      <Input type="hidden" name={`${field.name}.value`} value={value.value} />
    </>
  );
};

// Foursquare Field Component
export const FsqLexiconForm = () => {
  const field = useFieldContext<CommunityLexiconLocationFsq.Main>();
  const value = field.state.value;

  return (
    <>
      <Input
        type="hidden"
        name={`${field.name}.$type`}
        value="community.lexicon.location.fsq"
      />
      <Input type="hidden" name={`${field.name}.name`} value={value.name} />
      <Input
        type="hidden"
        name={`${field.name}.latitude`}
        value={value.latitude}
      />
      <Input
        type="hidden"
        name={`${field.name}.longitude`}
        value={value.longitude}
      />
      <Input
        type="hidden"
        name={`${field.name}.fsq_place_id`}
        value={value.fsq_place_id}
      />
    </>
  );
};

const formHook = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    AddressLexiconForm,
    HthreeLexiconForm,
    FsqLexiconForm,
  },
  formComponents: {},
});

export const useAppForm = formHook.useAppForm;
export const withForm = formHook.withForm;

export const AddressSubform = withForm({
  defaultValues: {
    address: {
      $type: "community.lexicon.location.address" as const,
      name: "",
      region: "",
      street: "",
      country: "",
      locality: "",
      postalCode: "",
    },
  },
  render: ({ form }) => (
    <form.AppField name="address">
      {(field) => <field.AddressLexiconForm />}
    </form.AppField>
  ),
});

export const HthreeSubform = withForm({
  defaultValues: {
    hthree: {
      $type: "community.lexicon.location.hthree" as const,
      name: "",
      value: "",
    },
  },
  render: ({ form }) => (
    <form.AppField name="hthree">
      {(field) => <field.HthreeLexiconForm />}
    </form.AppField>
  ),
});

export const FsqSubform = withForm({
  defaultValues: {
    fsq: {
      $type: "community.lexicon.location.fsq" as const,
      name: "",
      latitude: 0,
      longitude: 0,
      fsq_place_id: "",
    },
  },
  render: ({ form }) => (
    <form.AppField name="fsq">
      {(field) => <field.FsqLexiconForm />}
    </form.AppField>
  ),
});
