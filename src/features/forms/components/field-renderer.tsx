"use client";

import { CheckboxesField, BooleanField, RadioField, SelectField } from "../fields/choice-fields";
import {
  AddressField,
  AreaField,
  DateField,
  DateRangeField,
  DateTimeField,
  HeadingField,
  ImagesField,
  ItemListField,
  PersonField,
  RouteField,
  TimeField,
} from "../fields/composite-fields";
import { TextareaField, TextLikeField } from "../fields/text-fields";
import type { FormField } from "../types";
import type { RenderContext } from "./render-context";

/** One field by type. `name` is the RHF path, e.g. "details.acType". Generic — no template code. */
export function FieldRenderer({
  field,
  name,
  ctx,
}: {
  field: FormField;
  name: string;
  ctx: RenderContext;
}) {
  const props = { field, name, ctx };
  switch (field.type) {
    case "text":
    case "number":
    case "money":
    case "phone":
    case "url":
      return <TextLikeField field={field} name={name} />;
    case "textarea":
      return <TextareaField field={field} name={name} />;
    case "select":
      return <SelectField field={field} name={name} />;
    case "radio":
      return <RadioField field={field} name={name} />;
    case "multiselect":
    case "checkboxes":
      return <CheckboxesField field={field} name={name} />;
    case "boolean":
      return <BooleanField field={field} name={name} />;
    case "date":
      return <DateField {...props} />;
    case "time":
      return <TimeField {...props} />;
    case "datetime":
      return <DateTimeField {...props} />;
    case "daterange":
      return <DateRangeField {...props} />;
    case "area":
      return <AreaField {...props} />;
    case "address":
      return <AddressField {...props} />;
    case "route":
      return <RouteField {...props} />;
    case "person":
      return <PersonField {...props} />;
    case "item_list":
      return <ItemListField {...props} />;
    case "images":
      return <ImagesField {...props} />;
    case "heading":
      return <HeadingField field={field} />;
  }
}
