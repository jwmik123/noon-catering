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
 * @returns {object} VAT breakdown and totals
 */
export const calculateVATBreakdown = (foodSubtotal, deliverySubtotal) => {
  // Round inputs to 2 decimals
  const roundedFood = round2(foodSubtotal);
  const roundedDelivery = round2(deliverySubtotal);

  // Calculate VAT amounts (rounded to 2 decimals)
  const foodVAT = round2(roundedFood * VAT_RATES.FOOD);
  const deliveryVAT = round2(roundedDelivery * VAT_RATES.DELIVERY);
  const totalVAT = round2(foodVAT + deliveryVAT);

  // Calculate totals (rounded to 2 decimals)
  const subtotal = round2(roundedFood + roundedDelivery);
  const totalWithVAT = round2(subtotal + totalVAT);

  return {
    foodSubtotal: roundedFood,
    deliverySubtotal: roundedDelivery,
    subtotal: subtotal,
    foodVAT: foodVAT,
    deliveryVAT: deliveryVAT,
    totalVAT: totalVAT,
    foodTotal: round2(roundedFood + foodVAT),
    deliveryTotal: round2(roundedDelivery + deliveryVAT),
    totalWithVAT: totalWithVAT
  };
};

/**
 * Calculate total amount including correct VAT rates
 * @param {number} foodSubtotal - Food items subtotal (VAT-exclusive)
 * @param {number} deliveryCost - Delivery cost (VAT-exclusive)
 * @returns {number} Total amount including VAT
 */
export const calculateTotalWithVAT = (foodSubtotal, deliveryCost = 0) => {
  const breakdown = calculateVATBreakdown(foodSubtotal, deliveryCost);
  return breakdown.totalWithVAT;
};

/**
 * Format VAT breakdown for display
 * @param {number} foodSubtotal - Food items subtotal (VAT-exclusive)
 * @param {number} deliveryCost - Delivery cost (VAT-exclusive)
 * @returns {object} Formatted amounts for display
 */
export const formatVATBreakdown = (foodSubtotal, deliveryCost = 0) => {
  const breakdown = calculateVATBreakdown(foodSubtotal, deliveryCost);

  return {
    subtotal: `€${breakdown.subtotal.toFixed(2)}`,
    foodVAT: `€${breakdown.foodVAT.toFixed(2)}`,
    deliveryVAT: deliveryCost > 0 ? `€${breakdown.deliveryVAT.toFixed(2)}` : null,
    totalVAT: `€${breakdown.totalVAT.toFixed(2)}`,
    total: `€${breakdown.totalWithVAT.toFixed(2)}`,
    breakdown: breakdown
  };
};