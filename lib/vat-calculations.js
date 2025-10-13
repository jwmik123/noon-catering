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
 * @param {boolean} isPickup - Whether this is a pickup order (applies 5% discount)
 * @returns {object} VAT breakdown and totals
 */
export const calculateVATBreakdown = (foodSubtotal, deliverySubtotal, isPickup = false) => {
  // Apply 5% discount for pickup orders
  let discountedFoodSubtotal = foodSubtotal;
  let pickupDiscount = 0;

  if (isPickup) {
    pickupDiscount = Math.ceil(foodSubtotal * 0.05 * 100) / 100;
    discountedFoodSubtotal = foodSubtotal - pickupDiscount;
  }

  const foodVAT = Math.ceil(discountedFoodSubtotal * VAT_RATES.FOOD * 100) / 100;
  const deliveryVAT = Math.ceil(deliverySubtotal * VAT_RATES.DELIVERY * 100) / 100;
  const totalVAT = foodVAT + deliveryVAT;
  const totalWithVAT = discountedFoodSubtotal + deliverySubtotal + totalVAT;

  return {
    foodSubtotal: discountedFoodSubtotal,
    originalFoodSubtotal: foodSubtotal,
    pickupDiscount: pickupDiscount,
    deliverySubtotal: deliverySubtotal,
    subtotal: discountedFoodSubtotal + deliverySubtotal,
    foodVAT: foodVAT,
    deliveryVAT: deliveryVAT,
    totalVAT: totalVAT,
    foodTotal: discountedFoodSubtotal + foodVAT,
    deliveryTotal: deliverySubtotal + deliveryVAT,
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