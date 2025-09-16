// lib/vat-calculations.js
// VAT calculation utilities for Belgium

// VAT rates in Belgium
export const VAT_RATES = {
  FOOD: 0.06,    // 6% VAT for food items
  DELIVERY: 0.21  // 21% VAT for delivery services
};

/**
 * Calculate VAT amounts for food and delivery separately
 * @param {number} foodSubtotal - Subtotal for food items (VAT-exclusive)
 * @param {number} deliverySubtotal - Subtotal for delivery (VAT-exclusive)
 * @returns {object} VAT breakdown and totals
 */
export const calculateVATBreakdown = (foodSubtotal, deliverySubtotal) => {
  const foodVAT = Math.ceil(foodSubtotal * VAT_RATES.FOOD * 100) / 100;
  const deliveryVAT = Math.ceil(deliverySubtotal * VAT_RATES.DELIVERY * 100) / 100;
  const totalVAT = foodVAT + deliveryVAT;
  const totalWithVAT = foodSubtotal + deliverySubtotal + totalVAT;

  return {
    foodSubtotal: foodSubtotal,
    deliverySubtotal: deliverySubtotal,
    subtotal: foodSubtotal + deliverySubtotal,
    foodVAT: foodVAT,
    deliveryVAT: deliveryVAT,
    totalVAT: totalVAT,
    foodTotal: foodSubtotal + foodVAT,
    deliveryTotal: deliverySubtotal + deliveryVAT,
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