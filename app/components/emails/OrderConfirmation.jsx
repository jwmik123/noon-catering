import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { isDrink } from "@/lib/product-helpers";
import { calculateOrderTotal } from "@/lib/pricing-utils";
import { calculateVATBreakdown } from "@/lib/vat-calculations";
import { parseDateString } from "@/lib/utils";

// Helper function to format variety selection for both old and new structures
const formatVarietySelection = (varietySelection) => {
  if (!varietySelection || Object.keys(varietySelection).length === 0) {
    return "No variety selection specified";
  }

  const categoryLabels = {
    sandwiches: "Sandwiches",
    salads: "Salads",
    bowls: "Bowls"
  };

  const subCategoryLabels = {
    meat: "Meat",
    chicken: "Chicken",
    fish: "Fish",
    veggie: "Vegetarian",
    vegan: "Vegan"
  };

  let output = [];

  // Check if it's the new hierarchical format (contains hyphens)
  const hasHierarchicalFormat = Object.keys(varietySelection).some(key => key.includes('-'));

  if (hasHierarchicalFormat) {
    // New format: group by main category
    const categoryGroups = {};

    Object.entries(varietySelection).forEach(([key, quantity]) => {
      if (quantity > 0) {
        if (key.includes('-')) {
          const [mainCategory, subCategory] = key.split('-');
          if (!categoryGroups[mainCategory]) {
            categoryGroups[mainCategory] = [];
          }
          categoryGroups[mainCategory].push({
            subCategory,
            quantity
          });
        } else {
          // Backward compatibility: treat as sandwiches
          if (!categoryGroups.sandwiches) {
            categoryGroups.sandwiches = [];
          }
          categoryGroups.sandwiches.push({
            subCategory: key,
            quantity
          });
        }
      }
    });

    Object.entries(categoryGroups).forEach(([mainCategory, items]) => {
      const categoryLabel = categoryLabels[mainCategory] || mainCategory;
      output.push(`${categoryLabel}:`);

      items.forEach(({ subCategory, quantity }) => {
        const subLabel = subCategoryLabels[subCategory] || subCategory;
        output.push(`  • ${subLabel}: ${quantity} items`);
      });
    });
  } else {
    // Old format: direct subcategory mapping (backward compatibility)
    Object.entries(varietySelection).forEach(([key, quantity]) => {
      if (quantity > 0) {
        const label = subCategoryLabels[key] || key;
        output.push(`${label}: ${quantity} sandwiches`);
      }
    });
  }

  return output.join('\n');
};

export default function OrderConfirmation({
  quoteId,
  orderDetails,
  deliveryDetails,
  companyDetails,
  totalAmount, // This should be VAT-exclusive subtotal
  fullName,
  sandwichOptions = [],
  referenceNumber = null,
  amount = null, // New: prefer amount object if provided
  pricing = null, // Add pricing parameter
}) {
  // Helper function to check if bread type should be shown
  const shouldShowBreadType = (sandwichId, breadType) => {
    const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
    return sandwich && !isDrink(sandwich) && breadType;
  };

  // This function calculates the subtotal (VAT-exclusive) for the order using dynamic pricing.
  const calculateSubtotal = (orderDetails) => {
    return calculateOrderTotal(orderDetails, pricing);
  };

  return (
    <Html>
      <Head />
      <Preview>Thank you for your order at NOON Sandwicherie & Koffie</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={title}>Order Confirmation</Text>
          <Text style={paragraph}>
            Dear{" "}
            {companyDetails?.companyName || fullName || "customer"}
            ,
          </Text>
          <Text style={paragraph}>
            Thank you for your order. Below are the details of your order:
          </Text>

          <Section style={details}>
            <Text style={subtitle}>Quote ID</Text>
            <Text style={detailText}>{quoteId}</Text>

            {referenceNumber && (
              <>
                <Text style={subtitle}>Reference Number</Text>
                <Text style={detailText}>{referenceNumber}</Text>
              </>
            )}

            <Text style={subtitle}>Packaging</Text>
            <Text style={detailText}>
              {orderDetails.packagingType === "plateau"
                ? "Door twee gesneden en feestelijk verpakt op plateau"
                : "Individueel verpakt"}
            </Text>

            <Text style={subtitle}>Delivery details</Text>
            <Text style={detailText}>
              Date:{" "}
              {parseDateString(deliveryDetails.deliveryDate).toLocaleDateString(
                "nl-NL"
              )}
              <br />
              Time: {deliveryDetails.deliveryTime}
              <br />
              Phone: {deliveryDetails.phoneNumber || "Not provided"}
              <br />
              Address: {deliveryDetails.street} {deliveryDetails.houseNumber}
              {deliveryDetails.houseNumberAddition}
              <br />
              {deliveryDetails.postalCode} {deliveryDetails.city}
            </Text>

            <Text style={subtitle}>Order</Text>
            {orderDetails.selectionType === "custom" ? (
              Object.entries(orderDetails.customSelection).map(
                ([sandwichId, selections]) =>
                  selections.map((selection, index) => (
                    <Text key={index} style={detailText}>
                      {selection.quantity}x
                      {shouldShowBreadType(sandwichId, selection?.breadType) &&
                        ` - ${selection?.breadType}`}
                      {selection?.sauce !== "none" &&
                        ` with ${selection?.sauce}`}
                      {` - €${selection.subTotal.toFixed(2)}`}
                    </Text>
                  ))
              )
            ) : (
              <>
                <Text style={detailText}>
                  {formatVarietySelection(orderDetails.varietySelection)}
                </Text>
              </>
            )}

            {/* Drinks section */}
            {orderDetails.addDrinks && (orderDetails.drinks?.freshOrangeJuice > 0 || orderDetails.drinks?.sodas > 0) && (
              <>
                <Text style={subtitle}>Drinks</Text>
                <Text style={detailText}>
                  {orderDetails.drinks?.freshOrangeJuice > 0 && (
                    <>
                      Fresh Orange Juice: {orderDetails.drinks.freshOrangeJuice}x - €{(orderDetails.drinks.freshOrangeJuice * 3.35).toFixed(2)}
                      <br />
                    </>
                  )}
                  {orderDetails.drinks?.sodas > 0 && (
                    <>
                      Sodas: {orderDetails.drinks.sodas}x - €{(orderDetails.drinks.sodas * 2.35).toFixed(2)}
                      <br />
                    </>
                  )}
                </Text>
              </>
            )}

            {/* Desserts section */}
            {orderDetails.addDesserts && (orderDetails.desserts?.desserts > 0 || orderDetails.desserts?.cookies > 0) && (
              <>
                <Text style={subtitle}>Desserts</Text>
                <Text style={detailText}>
                  {orderDetails.desserts?.desserts > 0 && (
                    <>
                      Desserts: {orderDetails.desserts.desserts}x - €{(orderDetails.desserts.desserts * 3.50).toFixed(2)}
                      <br />
                    </>
                  )}
                  {orderDetails.desserts?.cookies > 0 && (
                    <>
                      Cookies: {orderDetails.desserts.cookies}x - €{(orderDetails.desserts.cookies * 2.50).toFixed(2)}
                      <br />
                    </>
                  )}
                </Text>
              </>
            )}

            <Text style={subtitle}>Total amount</Text>
            <Text style={detailText}>
              Subtotal: €{calculateSubtotal(orderDetails).toFixed(2)}
              <br />
              VAT Food (6%): €{Math.ceil(calculateSubtotal(orderDetails) * 0.06 * 100) / 100}
              <br />
              Total: €{totalAmount.toFixed(2)}
            </Text>
          </Section>

          <Section style={details}>
            <Text style={subtitle}>Allergies or comments</Text>
            <Text style={detailText}>{orderDetails.allergies}</Text>
          </Section>

          <Text style={paragraph}>
            If you have any questions about your order, please contact us.
          </Text>

          <Text style={paragraph}>
            With kind regards,
            <br />
            NOON Sandwicherie & Koffie
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#FFFCF8",
  fontFamily: "Helvetica, Arial, sans-serif",
};

const container = {
  backgroundColor: "#FFFCF8",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const title = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#524a98",
  padding: "0 48px",
};

const subtitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#524a98",
  marginBottom: "4px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#524a98",
  padding: "0 48px",
};

const details = {
  padding: "24px 48px",
  backgroundColor: "#FFFCF8",
  borderRadius: "4px",
  margin: "24px 48px",
  border: "1px solid #524a98",
};

const detailText = {
  fontSize: "14px",
  color: "#524a98",
  margin: "0 0 16px",
};
