import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
    }),
    defineField({
      name: "typeCategory",
      title: "Type Category",
      type: "string",
      options: {
        list: [
          { title: "Sandwiches", value: "sandwiches" },
          { title: "Salads", value: "salads" },
          { title: "Bowls", value: "bowls" },
          { title: "Desserts", value: "desserts" },
        ],
      },
    }),
    defineField({
      name: "subCategory",
      title: "Sub Category",
      type: "string",
      options: {
        list: [
          { title: "Meat", value: "meat" },
          { title: "Chicken", value: "chicken" },
          { title: "Fish", value: "fish" },
          { title: "Veggie", value: "veggie" },
          { title: "Vegan", value: "vegan" },
        ],
      },
    }),
    defineField({
      name: "allergyInfo",
      title: "Allergy Information",
      type: "array",
      description: "Select all allergens that may be present in this product",
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
          { title: "Lupin", value: "lupin" },
          { title: "Molluscs", value: "molluscs" },
        ],
      },
    }),
    defineField({
      name: "allergyNotes",
      title: "Additional Allergy Notes",
      type: "text",
      description:
        "Any additional information regarding allergens or cross-contamination",
    }),
    defineField({
      name: "hasSauceOptions",
      title: "Has Sauce Options",
      type: "boolean",
      description: "Enable if this product should have sauce selection options",
    }),
    defineField({
      name: "sauceOptions",
      title: "Sauce Options",
      type: "array",
      of: [
        {
          type: "object",
          name: "sauceOption",
          fields: [
            {
              name: "name",
              title: "Sauce Name",
              type: "string",
            },
            {
              name: "price",
              title: "Additional Price",
              type: "number",
              description: "Extra cost for this sauce (0 if no extra charge)",
              initialValue: 0,
            },
            {
              name: "isDefault",
              title: "Default Selection",
              type: "boolean",
              description: "Is this sauce selected by default?",
              initialValue: false,
            },
          ],
        },
      ],
      hidden: ({ document }) => !document?.hasSauceOptions,
      validation: (rule) =>
        rule.custom((sauces, context) => {
          if (
            context.document?.hasSauceOptions &&
            (!sauces || sauces.length === 0)
          ) {
            return "At least one sauce option is required when sauce options are enabled";
          }
          return true;
        }),
    }),
    defineField({
      name: "hasToppings",
      title: "Has Toppings",
      type: "boolean",
      description:
        "Enable if this product should have toppings selection options",
    }),
    defineField({
      name: "toppingOptions",
      title: "Topping Options",
      type: "array",
      of: [
        {
          type: "object",
          name: "toppingOption",
          fields: [
            {
              name: "topping",
              title: "Topping",
              type: "reference",
              to: [{ type: "toppingType" }],
              validation: (rule) => rule.required(),
            },
            {
              name: "price",
              title: "Additional Price",
              type: "number",
              description: "Extra cost for this topping (0 if no extra charge)",
              initialValue: 0,
            },
            {
              name: "isDefault",
              title: "Default Selection",
              type: "boolean",
              description: "Is this topping selected by default?",
              initialValue: false,
            },
          ],
          preview: {
            select: {
              toppingName: "topping.name",
              price: "price",
              isDefault: "isDefault",
            },
            prepare({ toppingName, price, isDefault }) {
              return {
                title: toppingName || "Unnamed topping",
                subtitle: `${price > 0 ? `+€${price.toFixed(2)}` : "Free"}${isDefault ? " (Default)" : ""}`,
              };
            },
          },
        },
      ],
      hidden: ({ document }) => !document?.hasToppings,
      validation: (rule) =>
        rule.custom((toppings, context) => {
          if (
            context.document?.hasToppings &&
            (!toppings || toppings.length === 0)
          ) {
            return "At least one topping option is required when toppings are enabled";
          }
          return true;
        }),
    }),
  ],
});
