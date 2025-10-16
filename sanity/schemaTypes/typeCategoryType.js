import { defineField, defineType } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export const typeCategory = defineType({
  name: "typeCategory",
  title: "Type Category",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "typeCategory" }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Display name (e.g., 'Sandwiches', 'Salads')",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "slug",
      description: "URL-friendly identifier (e.g., 'sandwiches', 'salads')",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description for this category",
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      description: "Uncheck to hide this category from the menu",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "value.current",
      active: "active",
    },
    prepare({ title, subtitle, active }) {
      return {
        title: title,
        subtitle: `${subtitle}${!active ? " (Inactive)" : ""}`,
      };
    },
  },
});
