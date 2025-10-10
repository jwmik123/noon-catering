/**
 * Pricing utility functions for calculating dynamic prices from Sanity data
 */

/**
 * Get price for a variety selection item
 * @param {string} key - The variety selection key (e.g., 'sandwiches-meat', 'lunchboxes-daily-chicken')
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {number} - The price for the item
 */
export const getVarietyPrice = (key, pricing) => {
  if (!pricing) {
    console.error('No pricing data available for key:', key);
    return 0; // Return 0 instead of hardcoded price to make errors obvious
  }

  const parts = key.split('-');

  // Handle old format (single word like "meat", "veggie", "vegan")
  if (parts.length === 1) {
    console.warn('Old variety selection format detected:', key, '- assuming sandwiches category');
    // Assume it's a sandwich subcategory for backward compatibility
    const sandwichCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'sandwiches');
    const subCatData = sandwichCategory?.subCategoryPricing?.find(sc => sc.subCategory === key);
    if (!subCatData?.price) {
      console.error(`No price found for old format key "${key}" in sandwiches category`);
      return 0;
    }
    return subCatData.price;
  }

  if (parts[0] === 'lunchboxes' && parts.length === 3) {
    // Lunchbox: price by box type
    const boxType = parts[1];
    const lunchboxCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'lunchboxes');
    const boxTypeData = lunchboxCategory?.boxTypes?.find(bt => bt.boxType === boxType);
    if (!boxTypeData?.price) {
      console.error(`No price found for lunchbox ${boxType} in key:`, key);
      return 0;
    }
    return boxTypeData.price;
  } else if (parts.length === 2) {
    // Sandwiches/Salads: price by subcategory
    const [typeCategory, subCategory] = parts;
    const categoryData = pricing.categoryPricing?.find(cat => cat.typeCategory === typeCategory);
    const subCatData = categoryData?.subCategoryPricing?.find(sc => sc.subCategory === subCategory);
    if (!subCatData?.price) {
      console.error(`No price found for ${typeCategory}-${subCategory} in key:`, key);
      return 0;
    }
    return subCatData.price;
  }

  console.error('Invalid key format:', key);
  return 0; // Return 0 instead of hardcoded price
};

/**
 * Calculate subtotal for variety selection using dynamic pricing
 * @param {Object} varietySelection - The variety selection object
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {number} - The calculated subtotal
 */
export const calculateVarietySubtotal = (varietySelection, pricing) => {
  if (!varietySelection) return 0;

  return Object.entries(varietySelection)
    .reduce((sum, [key, quantity]) => {
      const price = getVarietyPrice(key, pricing);
      return sum + (price * quantity);
    }, 0);
};

/**
 * Calculate total order amount including variety, drinks, and desserts
 * @param {Object} orderDetails - The order details object
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {number} - The calculated total
 */
export const calculateOrderTotal = (orderDetails, pricing) => {
  let subtotal = 0;

  if (!orderDetails) return 0;

  if (orderDetails.selectionType === "custom") {
    subtotal = Object.values(orderDetails.customSelection || {})
      .flat()
      .reduce((total, selection) => total + (selection.subTotal || 0), 0);
  } else if (orderDetails.selectionType === "variety") {
    // Calculate variety selection total using dynamic pricing
    subtotal = calculateVarietySubtotal(orderDetails.varietySelection, pricing);
  } else {
    // Legacy: fallback for old variety format - should not be used anymore
    console.warn('Using legacy variety format - this should be updated to use new format');
    const totalSandwiches = orderDetails.totalSandwiches || 0;
    // Use a default sandwich price from Sanity pricing
    const defaultPrice = pricing?.categoryPricing?.find(cat => cat.typeCategory === 'sandwiches')?.subCategoryPricing?.[0]?.price || 0;
    if (defaultPrice === 0) {
      console.error('No default sandwich price available in pricing data');
    }
    subtotal = totalSandwiches * defaultPrice;
  }

  // Add drinks pricing if drinks are selected
  if (orderDetails.addDrinks && orderDetails.drinks) {
    const drinksTotal =
      (orderDetails.drinks.freshOrangeJuice || 0) * (pricing?.drinks?.freshOrangeJuice || 3.35) +
      (orderDetails.drinks.sodas || 0) * (pricing?.drinks?.sodas || 2.35);
    subtotal += drinksTotal;
  }

  // Add desserts pricing if desserts are selected
  if (orderDetails.addDesserts && orderDetails.desserts) {
    const dessertsTotal =
      (orderDetails.desserts.desserts || 0) * (pricing?.desserts?.desserts || 3.50) +
      (orderDetails.desserts.cookies || 0) * (pricing?.desserts?.cookies || 2.50);
    subtotal += dessertsTotal;
  }

  return subtotal;
};

/**
 * Get drinks pricing from Sanity data
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {Object} - Object with drink prices
 */
export const getDrinksPricing = (pricing) => {
  return {
    freshOrangeJuice: pricing?.drinks?.freshOrangeJuice || 3.35,
    sodas: pricing?.drinks?.sodas || 2.35,
  };
};

/**
 * Get desserts pricing from Sanity data
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {Object} - Object with dessert prices
 */
export const getDessertsPricing = (pricing) => {
  return {
    desserts: pricing?.desserts?.desserts || 3.50,
    cookies: pricing?.desserts?.cookies || 2.50,
  };
};
