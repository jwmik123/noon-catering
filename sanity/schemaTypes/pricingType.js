import { defineField, defineType } from "sanity";

export const pricing = defineType({
  name: "pricing",
  title: "Pricing Configuration",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Configuration Name",
      type: "string",
      description: "E.g., 'Main Pricing' - Only one active configuration should exist",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      description: "Only one pricing configuration should be active at a time",
      initialValue: true,
    }),

    // Category-based pricing for variety offers
    defineField({
      name: "categoryPricing",
      title: "Category Pricing",
      type: "array",
      description: "Prices for different product categories in variety offers",
      of: [
        {
          type: "object",
          name: "categoryPrice",
          fields: [
            {
              name: "typeCategory",
              title: "Type Category",
              type: "string",
              options: {
                list: [
                  { title: "Sandwiches", value: "sandwiches" },
                  { title: "Salads", value: "salads" },
                  { title: "Lunchboxes", value: "lunchboxes" },
                  { title: "Desserts", value: "desserts" },
                ],
              },
              validation: (rule) => rule.required(),
            },
            {
              name: "description",
              title: "Category Description",
              type: "text",
              rows: 3,
              description: "Description shown to customers for this category in variety selection",
            },
            {
              name: "subCategoryPricing",
              title: "Sub Category Pricing",
              type: "array",
              description: "For sandwiches/salads: price per subcategory. For lunchboxes: not used (see box types below)",
              of: [
                {
                  type: "object",
                  fields: [
                    {
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
                      validation: (rule) => rule.required(),
                    },
                    {
                      name: "price",
                      title: "Price per Item",
                      type: "number",
                      description: "Price in euros (e.g., 6.83)",
                      validation: (rule) => rule.required().min(0),
                    },
                  ],
                  preview: {
                    select: {
                      subCategory: "subCategory",
                      price: "price",
                    },
                    prepare({ subCategory, price }) {
                      return {
                        title: subCategory,
                        subtitle: `€${price?.toFixed(2) || "0.00"}`,
                      };
                    },
                  },
                },
              ],
              hidden: ({ parent }) => parent?.typeCategory === "lunchboxes",
            },
            {
              name: "boxTypes",
              title: "Lunchbox Types",
              type: "array",
              description: "Different box types for lunchboxes (Daily, Plus, Deluxe)",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "boxType",
                      title: "Box Type",
                      type: "string",
                      description: "e.g., 'daily', 'plus', 'deluxe'",
                      validation: (rule) => rule.required(),
                    },
                    {
                      name: "displayName",
                      title: "Display Name",
                      type: "string",
                      description: "e.g., 'Daily Box', 'Plus Box', 'Deluxe Box'",
                      validation: (rule) => rule.required(),
                    },
                    {
                      name: "price",
                      title: "Price per Box",
                      type: "number",
                      description: "Price in euros (e.g., 13.00 for Daily, 16.00 for Plus, 18.00 for Deluxe)",
                      validation: (rule) => rule.required().min(0),
                    },
                    {
                      name: "description",
                      title: "Box Description",
                      type: "text",
                      rows: 2,
                      description: "Optional description of what's included in this box type",
                    },
                  ],
                  preview: {
                    select: {
                      displayName: "displayName",
                      price: "price",
                    },
                    prepare({ displayName, price }) {
                      return {
                        title: displayName,
                        subtitle: `€${price?.toFixed(2) || "0.00"}`,
                      };
                    },
                  },
                },
              ],
              hidden: ({ parent }) => parent?.typeCategory !== "lunchboxes",
            },
          ],
          preview: {
            select: {
              typeCategory: "typeCategory",
              description: "description",
              subCategoryPricing: "subCategoryPricing",
              boxTypes: "boxTypes",
            },
            prepare({ typeCategory, description, subCategoryPricing, boxTypes }) {
              const count = typeCategory === "lunchboxes"
                ? boxTypes?.length || 0
                : subCategoryPricing?.length || 0;
              const type = typeCategory === "lunchboxes" ? "box types" : "subcategories";

              return {
                title: typeCategory,
                subtitle: description || `${count} ${type} configured`,
              };
            },
          },
        },
      ],
    }),

    // Drinks pricing
    defineField({
      name: "drinks",
      title: "Drinks",
      type: "object",
      fields: [
        {
          name: "freshOrangeJuice",
          title: "Fresh Orange Juice",
          type: "number",
          description: "Price per fresh orange juice",
          initialValue: 3.35,
          validation: (rule) => rule.required().min(0),
        },
        {
          name: "sodas",
          title: "Sodas",
          type: "number",
          description: "Price per soda",
          initialValue: 2.35,
          validation: (rule) => rule.required().min(0),
        },
      ],
    }),

    // Desserts pricing
    defineField({
      name: "desserts",
      title: "Desserts",
      type: "object",
      fields: [
        {
          name: "desserts",
          title: "Desserts",
          type: "number",
          description: "Price per dessert",
          initialValue: 3.50,
          validation: (rule) => rule.required().min(0),
        },
        {
          name: "cookies",
          title: "Cookies",
          type: "number",
          description: "Price per cookie",
          initialValue: 2.50,
          validation: (rule) => rule.required().min(0),
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      active: "active",
    },
    prepare({ title, active }) {
      return {
        title: title,
        subtitle: active ? "✅ Active" : "Inactive",
      };
    },
  },
});
