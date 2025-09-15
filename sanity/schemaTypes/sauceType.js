import { defineField, defineType } from "sanity";

export const sauceType = defineType({
  name: "sauceType",
  title: "Sauce Type",
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
      description: "Unique identifier for this sauce (e.g., 'mosterd', 'pesto')",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description of the sauce",
    }),
    defineField({
      name: "isAvailable",
      title: "Available",
      type: "boolean",
      description: "Is this sauce currently available?",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      description: "Order in which this sauce should appear",
      initialValue: 0,
    }),
    defineField({
      name: "allergyInfo",
      title: "Allergy Information",
      type: "array",
      description: "Select all allergens that may be present in this sauce",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Gluten", value: "gluten" },
          { title: "Dairy", value: "dairy" },
          { title: "Eggs", value: "eggs" },
          { title: "Nuts", value: "nuts" },
          { title: "Peanuts", value: "peanuts" },
          { title: "Soy", value: "soy" },
          { title: "Fish", value: "fish" },
          { title: "Shellfish", value: "shellfish" },
          { title: "Mustard", value: "mustard" },
          { title: "Celery", value: "celery" },
          { title: "Sesame", value: "sesame" },
          { title: "Sulphites", value: "sulphites" },
        ],
      },
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