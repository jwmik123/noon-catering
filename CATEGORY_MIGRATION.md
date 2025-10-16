# Category Management Migration Guide

## Overview

The application has been upgraded from **hardcoded categories** to **dynamic, manageable categories** through Sanity Studio. This allows you to add, edit, and delete product categories without modifying code.

## What Changed

### Before
Categories were hardcoded in the product schema:
- Type Categories: sandwiches, salads, lunchboxes, desserts
- Sub Categories: meat, chicken, fish, veggie, vegan

### After
Categories are now managed as separate document types in Sanity:
- **Type Categories** (`typeCategory`) - Main product categories
- **Sub Categories** (`subCategory`) - Secondary classification (dietary/protein types)

Products now **reference** these category documents instead of storing string values.

## Migration Steps

### 1. Run the Migration Script

Before you can start using the new system, you need to populate the initial categories and update existing products:

```bash
# Make sure you have a Sanity API token with write permissions
# Add SANITY_API_TOKEN to your .env file

cd /Users/joelmik/Code/noon-catering
node sanity/migrations/populate-categories.js
```

This script will:
1. Create the initial type categories (Sandwiches, Salads, Lunchboxes, Desserts)
2. Create the initial sub categories (Meat, Chicken, Fish, Veggie, Vegan)
3. Update all existing products to reference these new category documents

### 2. Access Categories in Sanity Studio

After migration, you can manage categories at `/studio`:

1. Navigate to **Category Management** in the sidebar
2. Choose either **Type Categories** or **Sub Categories**
3. Add, edit, reorder, or deactivate categories as needed

## Managing Categories

### Type Categories

Located at: **Category Management → Type Categories**

Fields:
- **Name**: Display name (e.g., "Sandwiches")
- **Value**: URL-friendly slug (e.g., "sandwiches")
- **Description**: Optional description
- **Active**: Toggle to hide/show category

### Sub Categories

Located at: **Category Management → Sub Categories**

Fields:
- **Name**: Display name (e.g., "Vegan")
- **Value**: URL-friendly slug (e.g., "vegan")
- **Description**: Optional description
- **Active**: Toggle to hide/show category

### Adding New Categories

1. Go to **Category Management**
2. Select the category type you want to add
3. Click **Create** (+ icon)
4. Fill in the fields:
   - **Name**: User-friendly display name
   - **Value**: Auto-generated slug (can be customized)
   - **Description**: Optional helper text
   - **Active**: Check to make visible
5. Click **Publish**

### Deactivating Categories

Instead of deleting categories (which could break existing products):
1. Open the category document
2. Uncheck the **Active** field
3. Click **Publish**

The category will be hidden from the frontend but preserved in the database.

## Product Organization in Studio

Products are now organized by category combinations in the Studio sidebar:

```
Products
├── All Products (drag & drop ordering)
├── ─────────────
├── Sandwiches - Meat
├── Sandwiches - Chicken
├── Sandwiches - Fish
├── Sandwiches - Veggie
├── Sandwiches - Vegan
├── Salads - Veggie
└── ... (etc)
```

Each category view supports drag-and-drop reordering of products.

## Technical Details

### Schema Changes

**New Schema Types:**
- [`sanity/schemaTypes/typeCategoryType.js`](sanity/schemaTypes/typeCategoryType.js)
- [`sanity/schemaTypes/subCategoryType.js`](sanity/schemaTypes/subCategoryType.js)

**Updated Files:**
- [`sanity/schemaTypes/productType.js`](sanity/schemaTypes/productType.js) - Uses references instead of strings
- [`sanity/schemaTypes/index.js`](sanity/schemaTypes/index.js) - Exports new schemas
- [`sanity/lib/queries.js`](sanity/lib/queries.js) - Updated queries to dereference categories
- [`sanity/structure.js`](sanity/structure.js) - New category management section

**Frontend Changes:**
- [`app/components/MenuCategories.jsx`](app/components/MenuCategories.jsx) - Handles category objects
- [`lib/product-helpers.js`](lib/product-helpers.js) - Extracts category values from objects

### Data Structure

**Old Format:**
```javascript
{
  typeCategory: "sandwiches",
  subCategory: "vegan"
}
```

**New Format:**
```javascript
{
  typeCategory: {
    _id: "abc123",
    name: "Sandwiches",
    value: "sandwiches"
  },
  subCategory: {
    _id: "def456",
    name: "Vegan",
    value: "vegan"
  }
}
```

### Backward Compatibility

The frontend code includes fallback logic to handle both old string values and new object references:

```javascript
const typeCategoryValue = item.typeCategory?.value || item.typeCategory;
const typeCategoryName = item.typeCategory?.name || item.typeCategory;
```

This ensures the application works during migration and if old data exists.

## Benefits

1. **No Code Changes Required**: Add/modify categories through the CMS
2. **Better Organization**: Categories have descriptions and can be ordered
3. **Data Consistency**: Categories are reusable references
4. **Active/Inactive States**: Temporarily hide categories without deletion
5. **Easier Localization**: Category names can be updated without touching code

## Notes

- The pricing system still uses string-based category values for configuration
- The migration script is idempotent (can be run multiple times safely)
- Always backup your Sanity dataset before running migrations
- Deactivated categories are hidden but remain in the database

## Troubleshooting

**Products not showing after migration:**
- Verify categories are marked as `active: true`
- Check that products have both typeCategory and subCategory set
- Run the migration script again if references are missing

**Studio structure not updating:**
- Clear your browser cache
- Restart the Sanity development server
- Check console for GraphQL/GROQ errors

## Support

For issues or questions, refer to:
- [Sanity Documentation](https://www.sanity.io/docs)
- [CLAUDE.md](CLAUDE.md) - Project architecture guide
