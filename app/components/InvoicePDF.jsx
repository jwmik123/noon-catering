// app/components/InvoicePDF.jsx - Updated to include sandwich names
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { isDrink } from "@/lib/product-helpers";
import { calculateVATBreakdown } from "@/lib/vat-calculations";
import { calculateOrderTotal, getVarietyPrice } from "@/lib/pricing-utils";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 12,
    backgroundColor: "#FFFCF8",
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#524a98",
    paddingBottom: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    width: "80px",
    height: "80px",
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 600,
    color: "#524a98",
  },
  invoiceId: {
    fontSize: 12,
    color: "#524a98",
    marginBottom: 5,
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 600,
    color: "#524a98",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "30%",
    fontSize: 12,
    color: "#524a98",
  },
  value: {
    width: "70%",
    fontSize: 10,
    color: "#524a98",
  },
  table: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#524a98",
    padding: 5,
    borderBottom: 1,
    borderBottomColor: "#524a98",
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottom: 1,
    borderBottomColor: "#524a98",
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: "#524a98",
  },
  tableCellBold: {
    flex: 1,
    fontSize: 12,
    fontWeight: 600,
    color: "#FFFCF8",
  },
  tableCellName: {
    flex: 2,
    fontSize: 12,
    color: "#524a98",
  },
  tableCellBoldName: {
    flex: 2,
    fontSize: 12,
    fontWeight: 600,
    color: "#FFFCF8",
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  totalLabel: {
    width: "30%",
    fontSize: 12,
    fontWeight: 600,
    color: "#524a98",
  },
  totalValue: {
    width: "70%",
    fontSize: 12,
    color: "#524a98",
  },
  companyDetails: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: 1,
    borderTopColor: "#524a98",
    fontSize: 10,
    color: "#524a98",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailsColumn: {
    width: "48%",
  },
});

// Fallback image URL in case the environment variable is missing
const DEFAULT_IMAGE_URL = "https://catering.thesandwichbar.nl/tsb.png";

// Helper function to calculate total from variety selection (supports both old and new formats)
const calculateVarietyTotal = (varietySelection) => {
  if (!varietySelection || Object.keys(varietySelection).length === 0) {
    return 0;
  }

  return Object.values(varietySelection).reduce((total, quantity) => {
    return total + (quantity || 0);
  }, 0);
};

// Helper function to render variety selection for both old and new formats
const renderVarietySelection = (varietySelection, pricing) => {
  if (!varietySelection || Object.keys(varietySelection).length === 0) {
    return null;
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

  const rows = [];

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
            quantity,
            key
          });
        } else {
          // Backward compatibility: treat as sandwiches
          if (!categoryGroups.sandwiches) {
            categoryGroups.sandwiches = [];
          }
          categoryGroups.sandwiches.push({
            subCategory: key,
            quantity,
            key: `sandwiches-${key}`
          });
        }
      }
    });

    Object.entries(categoryGroups).forEach(([mainCategory, items]) => {
      const categoryLabel = categoryLabels[mainCategory] || mainCategory;

      items.forEach(({ subCategory, quantity, key }) => {
        const subLabel = subCategoryLabels[subCategory] || subCategory;
        const displayName = `${categoryLabel} - ${subLabel}`;

        rows.push(
          <View key={key} style={styles.tableRow}>
            <Text style={styles.tableCellName}>{displayName}</Text>
            <Text style={styles.tableCell}>{quantity}x</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>
              €{(quantity * getVarietyPrice(key, pricing)).toFixed(2)}
            </Text>
          </View>
        );
      });
    });
  } else {
    // Old format: direct subcategory mapping (backward compatibility)
    Object.entries(varietySelection).forEach(([key, quantity]) => {
      if (quantity > 0) {
        const label = subCategoryLabels[key] || key;

        rows.push(
          <View key={key} style={styles.tableRow}>
            <Text style={styles.tableCellName}>{label}</Text>
            <Text style={styles.tableCell}>{quantity}x</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>
              €{(quantity * getVarietyPrice(`sandwiches-${key}`, pricing)).toFixed(2)}
            </Text>
          </View>
        );
      }
    });
  }

  return rows;
};

const InvoicePDF = ({
  quoteId = "UNKNOWN",
  orderDetails = {},
  deliveryDetails = {},
  invoiceDetails = {},
  companyDetails = {},
  amount = 0,
  dueDate = new Date(),
  sandwichOptions = [], // Add sandwichOptions parameter
  referenceNumber = null, // Add reference number parameter
  fullName = null, // Add fullName parameter for non-business orders
  pricing = null, // Add pricing parameter
}) => {
  // Defensive coding: ensure all objects exist to prevent null references
  orderDetails = orderDetails || {};
  deliveryDetails = deliveryDetails || {};
  invoiceDetails = invoiceDetails || {};
  companyDetails = companyDetails || {};

  // Function to get sandwich name from ID
  const getSandwichName = (sandwichId) => {
    const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
    return sandwich ? sandwich.name : "Unknown Sandwich";
  };

  // Calculate amounts using PaymentStep.jsx pattern
  const amountData = (() => {
    // If amount is passed as an object with the correct structure, use it
    if (amount && typeof amount === 'object' && amount.total !== undefined) {
      return {
        subtotal: amount.subtotal || 0,
        delivery: amount.delivery || 0,
        foodVAT: amount.foodVAT || 0,
        deliveryVAT: amount.deliveryVAT || 0,
        vat: amount.vat || 0,
        total: amount.total || 0,
      };
    }

    // Otherwise, calculate from order details using dynamic pricing
    const subtotalAmount = calculateOrderTotal(orderDetails, pricing);

    // Delivery cost (VAT-exclusive)
    const deliveryCost = orderDetails.deliveryCost || 0;

    // Calculate VAT and total using correct Belgian VAT rates
    const vatBreakdown = calculateVATBreakdown(subtotalAmount, deliveryCost);

    return {
      subtotal: vatBreakdown.subtotal || 0,
      delivery: vatBreakdown.deliverySubtotal || 0,
      foodVAT: vatBreakdown.foodVAT || 0,
      deliveryVAT: vatBreakdown.deliveryVAT || 0,
      vat: vatBreakdown.totalVAT || 0,
      total: vatBreakdown.totalWithVAT || 0,
    };
  })();

  // Handle properly formatted dates or create defaults
  const formattedDueDate = dueDate
    ? new Date(dueDate)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // Calculate due date as 14 days after delivery date
  const deliveryDate = deliveryDetails?.deliveryDate
    ? new Date(deliveryDetails.deliveryDate + "T00:00:00+02:00")
    : new Date();

  // If we have a delivery date, calculate due date as 14 days after delivery date
  const calculatedDueDate = new Date(deliveryDate);
  calculatedDueDate.setDate(calculatedDueDate.getDate() + 14);
  const finalDueDate = dueDate ? formattedDueDate : calculatedDueDate;

  const today = new Date();

  // Safely get nested values
  const companyName =
    companyDetails?.name || companyDetails?.companyName || fullName || "Unknown Company";
  const phoneNumber = companyDetails?.phoneNumber || "";
  const address = companyDetails?.address || {};
  const street = address?.street || "";
  const houseNumber = address?.houseNumber || "";
  const houseNumberAddition = address?.houseNumberAddition || "";
  const postalCode = address?.postalCode || "";
  const city = address?.city || "";

  // Safe delivery details
  const deliveryTime = deliveryDetails?.deliveryTime || "12:00";
  const deliveryStreet = deliveryDetails?.address?.street || street;
  const deliveryHouseNumber =
    deliveryDetails?.address?.houseNumber || houseNumber;
  const deliveryHouseNumberAddition =
    deliveryDetails?.address?.houseNumberAddition || houseNumberAddition;
  const deliveryPostalCode = deliveryDetails?.address?.postalCode || postalCode;
  const deliveryCity = deliveryDetails?.address?.city || city;

  // Safe invoice details
  const invoiceStreet = invoiceDetails?.address?.street || deliveryStreet;
  const invoiceHouseNumber =
    invoiceDetails?.address?.houseNumber || deliveryHouseNumber;
  const invoiceHouseNumberAddition =
    invoiceDetails?.address?.houseNumberAddition || deliveryHouseNumberAddition;
  const invoicePostalCode =
    invoiceDetails?.address?.postalCode || deliveryPostalCode;
  const invoiceCity = invoiceDetails?.address?.city || deliveryCity;

  // Ensure selection properties exist
  const selectionType = orderDetails?.selectionType || "custom";
  const customSelection = orderDetails?.customSelection || {};
  const varietySelection = orderDetails?.varietySelection || {
    meat: 0,
    chicken: 0,
    fish: 0,
    veggie: 0,
    vegan: 0,
  };
  const allergies = orderDetails?.allergies || "None specified";

  // Safely get the image URL
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || "https://catering.thesandwichbar.nl";
  const imageUrl = {
    uri: `${baseUrl}/noon-logos/Logo-Noon-Catering3.png`,
    method: "GET",
  };

  // Create a safe rendering of custom selections
  const renderCustomSelections = () => {
    if (!customSelection || Object.keys(customSelection).length === 0) {
      return (
        <View style={styles.tableRow}>
          <Text style={styles.tableCellName}>No items selected</Text>
          <Text style={styles.tableCell}>-</Text>
          <Text style={styles.tableCell}>-</Text>
          <Text style={styles.tableCell}>-</Text>
          <Text style={styles.tableCell}>-</Text>
          <Text style={styles.tableCell}>-</Text>
          <Text style={styles.tableCell}>-</Text>
        </View>
      );
    }

    // Safely iterate through selections
    return Object.entries(customSelection).map(
      ([sandwichId, selections], sandwichIndex) => {
        if (!Array.isArray(selections)) return null;

        return selections.map((selection, index) => {
          if (!selection) return null;

          const qty = selection.quantity || 0;
          const breadType = selection.breadType || "-";
          const sauce = selection.sauce || "geen";
          const toppings = selection.toppings || [];
          const subTotal = selection.subTotal || 0;

          // Get the sandwich name for display
          const sandwichName = getSandwichName(sandwichId);

          // Find the sandwich to check if it's a drink/breakfast/sweet
          const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
          const shouldShowBreadType = sandwich && !isDrink(sandwich);

          return (
            <View key={`${sandwichId}-${index}`} style={styles.tableRow}>
              <Text style={styles.tableCellName}>{sandwichName}</Text>
              <Text style={styles.tableCell}>{qty}x</Text>
              <Text style={styles.tableCell}>
                {shouldShowBreadType ? breadType : "-"}
              </Text>
              <Text style={styles.tableCell}>
                {sauce !== "geen" ? sauce : "-"}
              </Text>
              <Text style={styles.tableCell}>
                {toppings.length > 0 ? toppings.join(", ") : "-"}
              </Text>
              <Text style={styles.tableCell}>€{subTotal.toFixed(2)}</Text>
            </View>
          );
        });
      }
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.invoiceId}>Invoice ID: {quoteId}</Text>
            <Text style={styles.invoiceId}>
              Date: {today.toLocaleDateString("nl-NL")}
            </Text>
            {referenceNumber && (
              <Text style={styles.invoiceId}>
                Reference Number: {referenceNumber}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Image src={imageUrl} style={styles.logo} />
          </View>
        </View>

        {/* Delivery and Payment Details */}
        <View style={styles.detailsContainer}>
          {/* Delivery Details */}
          <View style={styles.detailsColumn}>
            {deliveryDetails.deliveryDate && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Company:</Text>
                  <Text style={styles.value}>{companyName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>
                    {deliveryDetails.phoneNumber || "-"}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Delivery Date:</Text>
                  <Text style={styles.value}>
                    {deliveryDate.toLocaleDateString("nl-NL", {
                      timeZone: "Europe/Amsterdam",
                    })}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Time:</Text>
                  <Text style={styles.value}>{deliveryTime}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>
                    {deliveryStreet} {deliveryHouseNumber}
                    {deliveryHouseNumberAddition}
                    {"\n"}
                    {deliveryPostalCode} {deliveryCity}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Invoice Details */}
          <View style={styles.detailsColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invoice Address</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Company:</Text>
                <Text style={styles.value}>{companyName}</Text>
              </View>
              {companyDetails.btwNumber && (
                <View style={styles.row}>
                  <Text style={styles.label}>BTW Number:</Text>
                  <Text style={styles.value}>{companyDetails.btwNumber}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>
                  {invoiceStreet} {invoiceHouseNumber}
                  {invoiceHouseNumberAddition}
                  {"\n"}
                  {invoicePostalCode} {invoiceCity}
                </Text>
              </View>
            </View>

            {/* Payment Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>IBAN:</Text>
                <Text style={styles.value}>NL05 INGB 0006 8499 73</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>BIC:</Text>
                <Text style={styles.value}>INGBNL2A</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.value}>
                  NOON Sandwicherie & Koffie
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>VAT Number:</Text>
                <Text style={styles.value}>BTW BE 0795406037</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={styles.value}>
                  {finalDueDate.toLocaleDateString("nl-NL", {
                    timeZone: "Europe/Amsterdam",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Company Details if applicable */}
        {companyDetails.isCompany && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Company Name:</Text>
              <Text style={styles.value}>{companyName}</Text>
            </View>
            {companyDetails.btwNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>BTW Number:</Text>
                <Text style={styles.value}>{companyDetails.btwNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order</Text>
          <View style={styles.table}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellBoldName}>Sandwich</Text>
                <Text style={styles.tableCellBold}>Quantity</Text>
                <Text style={styles.tableCellBold}>Bread</Text>
                <Text style={styles.tableCellBold}>Sauce</Text>
                <Text style={styles.tableCellBold}>Toppings</Text>
                <Text style={styles.tableCellBold}>Price</Text>
              </View>
              {selectionType === "custom" ? (
                <>
                  {renderCustomSelections()}
                  {orderDetails?.deliveryCost &&
                    orderDetails.deliveryCost > 0 && (
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCellName}>Delivery</Text>
                        <Text style={styles.tableCell}>1x</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>
                          €{(orderDetails.deliveryCost || 0).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  {/* Drinks for custom selection */}
                  {orderDetails?.addDrinks && orderDetails.drinks?.freshOrangeJuice > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Fresh Orange Juice</Text>
                      <Text style={styles.tableCell}>{orderDetails.drinks.freshOrangeJuice}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.drinks.freshOrangeJuice * 3.35).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {orderDetails?.addDrinks && orderDetails.drinks?.sodas > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Sodas</Text>
                      <Text style={styles.tableCell}>{orderDetails.drinks.sodas}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.drinks.sodas * 2.35).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {/* Desserts for custom selection */}
                  {orderDetails?.addDesserts && orderDetails.desserts?.desserts > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Desserts</Text>
                      <Text style={styles.tableCell}>{orderDetails.desserts.desserts}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.desserts.desserts * 3.50).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {orderDetails?.addDesserts && orderDetails.desserts?.cookies > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Cookies</Text>
                      <Text style={styles.tableCell}>{orderDetails.desserts.cookies}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.desserts.cookies * 2.50).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {renderVarietySelection(varietySelection, pricing)}
                  {orderDetails?.deliveryCost &&
                    orderDetails.deliveryCost > 0 && (
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCellName}>Delivery</Text>
                        <Text style={styles.tableCell}>1x</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>-</Text>
                        <Text style={styles.tableCell}>
                          €{(orderDetails.deliveryCost || 0).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  {/* Drinks for variety selection */}
                  {orderDetails?.addDrinks && orderDetails.drinks?.freshOrangeJuice > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Fresh Orange Juice</Text>
                      <Text style={styles.tableCell}>{orderDetails.drinks.freshOrangeJuice}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.drinks.freshOrangeJuice * 3.35).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {orderDetails?.addDrinks && orderDetails.drinks?.sodas > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Sodas</Text>
                      <Text style={styles.tableCell}>{orderDetails.drinks.sodas}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.drinks.sodas * 2.35).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {/* Desserts for variety selection */}
                  {orderDetails?.addDesserts && orderDetails.desserts?.desserts > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Desserts</Text>
                      <Text style={styles.tableCell}>{orderDetails.desserts.desserts}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.desserts.desserts * 3.50).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {orderDetails?.addDesserts && orderDetails.desserts?.cookies > 0 && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCellName}>Cookies</Text>
                      <Text style={styles.tableCell}>{orderDetails.desserts.cookies}x</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>
                        €{(orderDetails.desserts.cookies * 2.50).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies or comments</Text>
          <Text style={styles.value}>{allergies}</Text>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              €{(amountData.subtotal || 0).toFixed(2)}
            </Text>
          </View>
          {(amountData.delivery || 0) > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery:</Text>
              <Text style={styles.totalValue}>
                €{(amountData.delivery || 0).toFixed(2)}
              </Text>
            </View>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery:</Text>
              <Text style={styles.totalValue}>Free</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT Food (6%):</Text>
            <Text style={styles.totalValue}>€{(amountData.foodVAT || 0).toFixed(2)}</Text>
          </View>
          {(amountData.deliveryVAT || 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT Delivery (21%):</Text>
              <Text style={styles.totalValue}>€{(amountData.deliveryVAT || 0).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total VAT:</Text>
            <Text style={styles.totalValue}>€{(amountData.vat || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={[styles.totalValue, { fontWeight: 600 }]}>
              €{(amountData.total || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.companyDetails}>
          <Text>NOON Sandwicherie & Koffie</Text>
          <Text>Keizer Leopoldstraat 1</Text>
          <Text>9000 Gent, België</Text>
          <Text>bestel@noonsandwicherie.be</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
