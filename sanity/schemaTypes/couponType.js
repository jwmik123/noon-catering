export const coupon = {
  name: "coupon",
  title: "Coupon Codes",
  type: "document",
  fields: [
    {
      name: "code",
      title: "Code",
      type: "string",
      validation: (Rule) => Rule.required().uppercase(),
    },
    {
      name: "discountType",
      title: "Discount Type",
      type: "string",
      options: {
        list: [
          { title: "Percentage (%)", value: "percentage" },
          { title: "Fixed amount (€)", value: "fixed" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "discountValue",
      title: "Discount Value",
      type: "number",
      description: "Percentage (0-100) or fixed amount in € (ex. VAT)",
      validation: (Rule) => Rule.required().positive(),
    },
    {
      name: "expiresAt",
      title: "Expiry Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    },
    {
      name: "description",
      title: "Admin Notes",
      type: "string",
    },
  ],
  preview: {
    select: {
      title: "code",
      discountType: "discountType",
      discountValue: "discountValue",
      active: "active",
      expiresAt: "expiresAt",
    },
    prepare({ title, discountType, discountValue, active, expiresAt }) {
      const value =
        discountType === "percentage"
          ? `${discountValue}%`
          : `€${discountValue}`;
      const expired = expiresAt && new Date(expiresAt) < new Date();
      const status = !active ? "Inactive" : expired ? "Expired" : "Active";
      return {
        title,
        subtitle: `${value} — ${status}`,
      };
    },
  },
};
