# VarietySelector Implementation Summary

## Status: Schema & Query Ready ✅

The backend is fully configured. Here's what's left to complete:

## What's Been Implemented:

### 1. Pricing Schema ([sanity/schemaTypes/pricingType.js](sanity/schemaTypes/pricingType.js))
- ✅ Sandwiches & Salads: subcategory pricing (meat, chicken, fish, veggie, vegan)
- ✅ Lunchboxes: Box types (daily, plus, deluxe) with separate pricing
- ✅ Category descriptions for each type
- ✅ Drinks & desserts pricing

### 2. Pricing Query ([sanity/lib/queries.js](sanity/lib/queries.js:62-87))
- ✅ Fetches active pricing configuration
- ✅ Includes descriptions, box types, subcategory pricing

### 3. Data Flow ([app/page.js](app/page.js))
- ✅ Fetches pricing from Sanity
- ✅ Passes pricing to SelectionTypeStep
- ✅ SelectionTypeStep passes pricing to VarietySelector

## What You Need to Configure in Sanity Studio:

Go to http://localhost:3000/studio and update your Pricing Configuration:

### Sandwiches
- **Description**: "Fresh sandwiches made daily with quality ingredients"
- **SubCategory Pricing**:
  - Meat: €6.83
  - Chicken: €6.83
  - Fish: €7.50
  - Veggie: €6.50
  - Vegan: €6.50

### Salads
- **Description**: "Healthy and fresh salads"
- **SubCategory Pricing**:
  - Meat: €7.50
  - Chicken: €7.50
  - Fish: €8.50
  - Veggie: €7.00
  - Vegan: €7.00

### Lunchboxes
- **Description**: "Complete lunchboxes with sides and drinks"
- **Box Types** (add 3):
  1. Box Type: `daily`, Display Name: `Daily Box`, Price: `13.00`, Description: "Basic healthy lunch option"
  2. Box Type: `plus`, Display Name: `Plus Box`, Price: `16.00`, Description: "Extra portions with premium ingredients"
  3. Box Type: `deluxe`, Display Name: `Deluxe Box`, Price: `18.00`, Description: "Premium selection with exclusive items"

## Next Steps for Frontend:

The VarietySelector component needs to be rewritten to:

1. **Display categories dynamically** from pricing data with descriptions
2. **Handle lunchboxes differently**:
   - First select box type (Daily/Plus/Deluxe)
   - Then select protein type (meat/chicken/fish/veggie/vegan)
   - Store as: `lunchboxes-daily-meat`, `lunchboxes-plus-vegan`, etc.
3. **Show dynamic pricing** for each option
4. **Update OrderSummaryStep** to display lunchbox selections properly
5. **Replace hardcoded prices** (€6.83, €3.35, €2.35, €3.50, €2.50) with Sanity pricing

## Data Structure for Variety Selection:

### Old Format (Sandwiches/Salads):
```javascript
{
  "sandwiches-meat": 5,
  "sandwiches-veggie": 3,
  "salads-chicken": 2
}
```

### New Format (Including Lunchboxes):
```javascript
{
  "sandwiches-meat": 5,
  "salads-veggie": 3,
  "lunchboxes-daily-chicken": 2,  // Daily box with chicken
  "lunchboxes-plus-vegan": 1,      // Plus box with vegan
  "lunchboxes-deluxe-fish": 1      // Deluxe box with fish
}
```

## Pricing Calculation Example:

For `lunchboxes-daily-chicken: 2`:
- Box type price: €13.00 (from boxTypes array)
- Quantity: 2
- **Total: €26.00**

The protein type (chicken) is just for selection - the price is determined by the box type.

## Files to Update:

1. [app/components/VarietySelector.jsx](app/components/VarietySelector.jsx) - Complete rewrite
2. [app/components/steps/OrderSummaryStep.jsx](app/components/steps/OrderSummaryStep.jsx) - Update lunchbox display
3. [app/components/steps/SelectionTypeStep.jsx](app/components/steps/SelectionTypeStep.jsx) - Replace hardcoded prices with `pricing?.drinks?.freshOrangeJuice` etc.

Would you like me to proceed with rewriting these components now?
