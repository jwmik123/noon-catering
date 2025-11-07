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
import { parseDateString } from "@/lib/utils";

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
  quoteId: {
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
    fontSize: 12,
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
    color: "#FFFCF8",
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
  sandwichItem: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 10,
    paddingLeft: 10,
  },
  sandwichName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#524a98",
    marginBottom: 2,
  },
  sandwichDetails: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    fontSize: 12,
    color: "#524a98",
    marginLeft: 10,
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
  bold: {
    fontWeight: 600,
    fontSize: 12,
    color: "#524a98",
  },
  deliveryDetails: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  detailsContainer: {
    display: "flex",
    flexDirection: "row",
  },
  detailsColumn: {
    flex: 1,
  },
});

// Helper function to render variety selection for both old and new structures
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

export const OrderPDF = ({ orderData, quoteId, sandwichOptions = [], pricing = null }) => {
  // Safely get nested values
  const companyName =
    orderData.companyDetails?.name ||
    orderData.companyDetails?.companyName ||
    orderData.name ||
    "Unknown Company";
  const phoneNumber = orderData.companyDetails?.phoneNumber || "";
  const address = orderData.companyDetails?.address || {};
  const street = address?.street || "";
  const houseNumber = address?.houseNumber || "";
  const houseNumberAddition = address?.houseNumberAddition || "";
  const postalCode = address?.postalCode || "";
  const city = address?.city || "";

  // Safe delivery details
  const deliveryTime = orderData.deliveryTime || "12:00";
  const deliveryStreet = orderData.street || street;
  const deliveryHouseNumber = orderData.houseNumber || houseNumber;
  const deliveryHouseNumberAddition =
    orderData.houseNumberAddition || houseNumberAddition;
  const deliveryPostalCode = orderData.postalCode || postalCode;
  const deliveryCity = orderData.city || city;

  // Safe invoice details
  const invoiceStreet = orderData.invoiceStreet || deliveryStreet;
  const invoiceHouseNumber =
    orderData.invoiceHouseNumber || deliveryHouseNumber;
  const invoiceHouseNumberAddition =
    orderData.invoiceHouseNumberAddition || deliveryHouseNumberAddition;
  const invoicePostalCode = orderData.invoicePostalCode || deliveryPostalCode;
  const invoiceCity = orderData.invoiceCity || deliveryCity;

  // Safely get the image URL
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || "https://catering.noonsandwicherie.be";
  const imageUrl = {
    uri: `${baseUrl}/noon-logos/Logo-Noon-Catering3.png`,
    method: "GET",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Quote</Text>
            <Text style={styles.quoteId}>Quote ID: {quoteId}</Text>
            <Text style={styles.quoteId}>
              Date: {new Date().toLocaleDateString("nl-NL")}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Image src={imageUrl} style={styles.logo} />
          </View>
        </View>

        {/* Delivery and Invoice Details */}
        <View style={styles.detailsContainer}>
          {/* Delivery Details */}
          <View style={styles.detailsColumn}>
            {orderData.deliveryDate && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>
                    {parseDateString(orderData.deliveryDate).toLocaleDateString(
                      "nl-NL"
                    )}
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
          </View>
        </View>

        {/* Company Details if applicable */}
        {orderData.isCompany && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Company Name:</Text>
              <Text style={styles.value}>{companyName}</Text>
            </View>
            {orderData.companyVAT && (
              <View style={styles.row}>
                <Text style={styles.label}>VAT Number:</Text>
                <Text style={styles.value}>{orderData.companyVAT}</Text>
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
              {orderData.selectionType === "custom" ? (
                Object.entries(orderData.customSelection || {}).map(
                  ([sandwichId, selections]) => {
                    if (!Array.isArray(selections)) return null;

                    return selections.map((selection, index) => {
                      if (!selection) return null;

                      const qty = selection.quantity || 0;
                      const breadType = selection.breadType || "-";
                      const sauce = selection.sauce || "geen";
                      const toppings = selection.toppings || [];
                      const subTotal = selection.subTotal || 0;

                      // Get the sandwich name for display
                      const sandwich = sandwichOptions.find(
                        (s) => s._id === sandwichId
                      );
                      const sandwichName = sandwich
                        ? sandwich.name
                        : "Unknown Sandwich";

                      // Check if we should show bread type for this item
                      const shouldShowBreadType =
                        sandwich && !isDrink(sandwich);

                      return (
                        <View
                          key={`${sandwichId}-${index}`}
                          style={styles.tableRow}
                        >
                          <Text style={styles.tableCellName}>
                            {sandwichName}
                          </Text>
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
                          <Text style={styles.tableCell}>
                            €{subTotal.toFixed(2)}
                          </Text>
                        </View>
                      );
                    });
                  }
                )
              ) : (
                <>
                  {renderVarietySelection(orderData.varietySelection, pricing)}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Drinks section */}
        {orderData.addDrinks && (orderData.drinks?.freshOrangeJuice > 0 || orderData.drinks?.sodas > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Drinks</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Item</Text>
                <Text style={styles.tableHeaderCell}>Quantity</Text>
                <Text style={styles.tableHeaderCell}>Price</Text>
                <Text style={styles.tableHeaderCell}>Total</Text>
              </View>
              <View style={styles.tableBody}>
                {orderData.drinks?.freshOrangeJuice > 0 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellName}>Fresh Orange Juice</Text>
                    <Text style={styles.tableCell}>{orderData.drinks.freshOrangeJuice}x</Text>
                    <Text style={styles.tableCell}>€3.35</Text>
                    <Text style={styles.tableCell}>
                      €{(orderData.drinks.freshOrangeJuice * 3.35).toFixed(2)}
                    </Text>
                  </View>
                )}
                {orderData.drinks?.sodas > 0 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellName}>Sodas</Text>
                    <Text style={styles.tableCell}>{orderData.drinks.sodas}x</Text>
                    <Text style={styles.tableCell}>€2.35</Text>
                    <Text style={styles.tableCell}>
                      €{(orderData.drinks.sodas * 2.35).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Desserts section */}
        {orderData.addDesserts && (orderData.desserts?.desserts > 0 || orderData.desserts?.cookies > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desserts</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Item</Text>
                <Text style={styles.tableHeaderCell}>Quantity</Text>
                <Text style={styles.tableHeaderCell}>Price</Text>
                <Text style={styles.tableHeaderCell}>Total</Text>
              </View>
              <View style={styles.tableBody}>
                {orderData.desserts?.desserts > 0 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellName}>Desserts</Text>
                    <Text style={styles.tableCell}>{orderData.desserts.desserts}x</Text>
                    <Text style={styles.tableCell}>€3.50</Text>
                    <Text style={styles.tableCell}>
                      €{(orderData.desserts.desserts * 3.50).toFixed(2)}
                    </Text>
                  </View>
                )}
                {orderData.desserts?.cookies > 0 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCellName}>Cookies</Text>
                    <Text style={styles.tableCell}>{orderData.desserts.cookies}x</Text>
                    <Text style={styles.tableCell}>€2.50</Text>
                    <Text style={styles.tableCell}>
                      €{(orderData.desserts.cookies * 2.50).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies or comments</Text>
          <Text style={styles.value}>
            {orderData.allergies || "None specified"}
          </Text>
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              €{calculateSubtotal(orderData, pricing).toFixed(2)}
            </Text>
          </View>
          {(() => {
            const foodSubtotal = calculateSubtotal(orderData, pricing);
            const deliveryCost = orderData.deliveryCost || 0;
            const isPickup = orderData.isPickup || false;
            const vatBreakdown = calculateVATBreakdown(foodSubtotal, deliveryCost, isPickup);

            return (
              <>
                {isPickup && (vatBreakdown.pickupDiscount || 0) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Pickup Discount (5%):</Text>
                    <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                      -€{(vatBreakdown.pickupDiscount || 0).toFixed(2)}
                    </Text>
                  </View>
                )}
                {deliveryCost > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Delivery:</Text>
                    <Text style={styles.totalValue}>
                      €{deliveryCost.toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Delivery:</Text>
                    <Text style={styles.totalValue}>{isPickup ? "Pick Up" : "TBD"}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>VAT Food (6%):</Text>
                  <Text style={styles.totalValue}>
                    €{vatBreakdown.foodVAT.toFixed(2)}
                  </Text>
                </View>
                {deliveryCost > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>VAT Delivery (21%):</Text>
                    <Text style={styles.totalValue}>
                      €{vatBreakdown.deliveryVAT.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total VAT:</Text>
                  <Text style={styles.totalValue}>
                    €{vatBreakdown.totalVAT.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={[styles.totalValue, { fontWeight: 600 }]}>
                    €{vatBreakdown.totalWithVAT.toFixed(2)}
                  </Text>
                </View>
              </>
            );
          })()}
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

// Utility function to calculate subtotal using dynamic pricing
const calculateSubtotal = (orderData, pricing) => {
  return calculateOrderTotal(orderData, pricing);
};

export default OrderPDF;
