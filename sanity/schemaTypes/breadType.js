import { defineField, defineType } from "sanity";

export const breadType = defineType({
  name: "breadType",
  title: "Bread Type",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "string",
      description: "Unique identifier for this bread type (e.g., 'baguette', 'spelt')",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "surcharge",
      title: "Surcharge (€)",
      type: "number",
      description: "Additional cost for this bread type",
      initialValue: 0,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description of the bread type",
    }),
    defineField({
      name: "isAvailable",
      title: "Available",
      type: "boolean",
      description: "Is this bread type currently available?",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      description: "Order in which this bread type should appear",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
    {
      title: "Name",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});