// lib/vat-calculations.js
// VAT calculation utilities for Belgium

// VAT rates in Belgium
export const VAT_RATES = {
  FOOD: 0.06,    // 6% VAT for food items
  DELIVERY: 0.21  // 21% VAT for delivery services
};

/**
 * Round to 2 decimal places (standard rounding)
 * @param {number} value - The value to round
 * @returns {number} - Rounded value
 */
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Calculate VAT amounts for food and delivery separately
 * All values are rounded to 2 decimal places to match Billit
 * @param {number} foodSubtotal - Subtotal for food items (VAT-exclusive)
 * @param {number} deliverySubtotal - Subtotal for delivery (VAT-exclusive)
 * @param {boolean} isPickup - Whether this is a pickup order (applies 5% discount)
 * @returns {object} VAT breakdown and totals
 */
export const calculateVATBreakdown = (foodSubtotal, deliverySubtotal, isPickup = false) => {
  // Round inputs to 2 decimals
  const roundedFood = round2(foodSubtotal);
  const roundedDelivery = round2(deliverySubtotal);

  // Apply 5% discount for pickup orders
  let discountedFoodSubtotal = roundedFood;
  let pickupDiscount = 0;

  if (isPickup) {
    pickupDiscount = round2(roundedFood * 0.05);
    discountedFoodSubtotal = round2(roundedFood - pickupDiscount);
  }

  // Calculate VAT amounts (rounded to 2 decimals)
  const foodVAT = round2(discountedFoodSubtotal * VAT_RATES.FOOD);
  const deliveryVAT = round2(roundedDelivery * VAT_RATES.DELIVERY);
  const totalVAT = round2(foodVAT + deliveryVAT);

  // Calculate totals (rounded to 2 decimals)
  const subtotal = round2(discountedFoodSubtotal + roundedDelivery);
  const totalWithVAT = round2(subtotal + totalVAT);

  return {
    foodSubtotal: discountedFoodSubtotal,
    originalFoodSubtotal: roundedFood,
    pickupDiscount: pickupDiscount,
    deliverySubtotal: roundedDelivery,
    subtotal: subtotal,
    foodVAT: foodVAT,
    deliveryVAT: deliveryVAT,
    totalVAT: totalVAT,
    foodTotal: round2(discountedFoodSubtotal + foodVAT),
    deliveryTotal: round2(roundedDelivery + deliveryVAT),
    totalWithVAT: totalWithVAT
  };
};

/**
 * Calculate total amount including correct VAT rates
 * @param {number} foodSubtotal - Food items subtotal (VAT-exclusive)
 * @param {number} deliveryCost - Delivery cost (VAT-exclusive)
 * @param {boolean} isPickup - Whether this is a pickup order (applies 5% discount)
 * @returns {number} Total amount including VAT
 */
export const calculateTotalWithVAT = (foodSubtotal, deliveryCost = 0, isPickup = false) => {
  const breakdown = calculateVATBreakdown(foodSubtotal, deliveryCost, isPickup);
  return breakdown.totalWithVAT;
};

/**
 * Format VAT breakdown for display
 * @param {number} foodSubtotal - Food items subtotal (VAT-exclusive)
 * @param {number} deliveryCost - Delivery cost (VAT-exclusive)
 * @param {boolean} isPickup - Whether this is a pickup order (applies 5% discount)
 * @returns {object} Formatted amounts for display
 */
export const formatVATBreakdown = (foodSubtotal, deliveryCost = 0, isPickup = false) => {
  const breakdown = calculateVATBreakdown(foodSubtotal, deliveryCost, isPickup);

  return {
    subtotal: `€${breakdown.subtotal.toFixed(2)}`,
    pickupDiscount: isPickup ? `€${breakdown.pickupDiscount.toFixed(2)}` : null,
    foodVAT: `€${breakdown.foodVAT.toFixed(2)}`,
    deliveryVAT: deliveryCost > 0 ? `€${breakdown.deliveryVAT.toFixed(2)}` : null,
    totalVAT: `€${breakdown.totalVAT.toFixed(2)}`,
    total: `€${breakdown.totalWithVAT.toFixed(2)}`,
    breakdown: breakdown
  };
};