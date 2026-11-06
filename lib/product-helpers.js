// Helper functions for product type checking and calculations
export const isDrink = (product) => {
  const typeCategoryValue = product.typeCategory?.value || product.typeCategory;
  return typeCategoryValue === "desserts";
};

// Type categories in Sanity that hold sandwiches; these get a bread choice.
// "sandwiches" is the old category, kept for quotes from before the new menu.
const SANDWICH_CATEGORIES = ["sandwiches", "noonspecials", "noonclassics", "noonveggie"];

export const isSandwich = (product) => {
  const typeCategoryValue = product.typeCategory?.value || product.typeCategory;
  return SANDWICH_CATEGORIES.includes(typeCategoryValue);
};

// The bread as the customer saw it. Orders from before breadName existed only
// hold the slug, which is what their documents have always shown.
export const breadLabel = (selection) => selection?.breadName || selection?.breadType;

export const calculateRemainingQuantity = (formData, totalAllowed) => {
  if (!formData.customSelection) return totalAllowed;

  // Only count non-drink items towards the total
  return (
    totalAllowed -
    Object.entries(formData.customSelection).reduce(
      (sum, [sandwichId, selections]) => {
        // Find the product in sandwichOptions to check if it's a drink
        const product = formData.sandwichOptions?.find(
          (s) => s._id === sandwichId
        );
        if (!product || isDrink(product)) return sum;

        // Sum up quantities for non-drink items
        return (
          sum +
          selections.reduce((total, selection) => total + selection.quantity, 0)
        );
      },
      0
    )
  );
};

export const getTotalSelectedItems = (formData) => {
  if (!formData.customSelection) return 0;

  return Object.entries(formData.customSelection).reduce(
    (sum, [sandwichId, selections]) => {
      // Find the product to check if it's a drink
      const product = formData.sandwichOptions?.find(
        (s) => s._id === sandwichId
      );
      if (!product || isDrink(product)) return sum;

      // Sum up quantities for non-drink items
      return (
        sum +
        selections.reduce((total, selection) => total + selection.quantity, 0)
      );
    },
    0
  );
};

export const getTotalSelectedDrinks = (formData) => {
  if (!formData.customSelection) return 0;

  return Object.entries(formData.customSelection).reduce(
    (sum, [sandwichId, selections]) => {
      // Find the product to check if it's a drink
      const product = formData.sandwichOptions?.find(
        (s) => s._id === sandwichId
      );
      if (!product || !isDrink(product)) return sum;

      // Sum up quantities for drink items
      return (
        sum +
        selections.reduce((total, selection) => total + selection.quantity, 0)
      );
    },
    0
  );
};
