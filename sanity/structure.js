// https://www.sanity.io/docs/structure-builder-cheat-sheet
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'

export const structure = (S, context) =>
  S.list()
    .title('Content')
    .items([
      // Dynamic Products list by typeCategory and subCategory
      S.listItem()
        .title('Products')
        .child(async () => {
          // Fetch unique category combinations with references
          const products = await context.getClient({ apiVersion: '2024-01-01' }).fetch(
            `*[_type == "product" && defined(typeCategory) && defined(subCategory)]{
              "typeCategoryId": typeCategory._ref,
              "typeCategoryValue": typeCategory->value.current,
              "typeCategoryName": typeCategory->name,
              "subCategoryId": subCategory._ref,
              "subCategoryValue": subCategory->value.current,
              "subCategoryName": subCategory->name
            }`
          )

          // Create unique combinations using a Map
          const categoryMap = new Map()
          products.forEach(p => {
            if (p.typeCategoryId && p.subCategoryId) {
              const key = `${p.typeCategoryId}-${p.subCategoryId}`
              if (!categoryMap.has(key)) {
                categoryMap.set(key, p)
              }
            }
          })

          // Convert to array and sort by names
          const validCategories = Array.from(categoryMap.values())
            .sort((a, b) => {
              if (a.typeCategoryName !== b.typeCategoryName) {
                return a.typeCategoryName.localeCompare(b.typeCategoryName)
              }
              return a.subCategoryName.localeCompare(b.subCategoryName)
            })

          return S.list()
            .title('Products by Category')
            .items([
              // All products with drag-and-drop
              orderableDocumentListDeskItem({
                type: 'product',
                title: 'All Products',
                id: 'orderable-products-all',
                S,
                context,
              }),

              S.divider(),

              // Dynamically create category/subcategory items
              ...validCategories.map((cat) => {
                const title = `${cat.typeCategoryName} - ${cat.subCategoryName}`
                const id = `orderable-products-${cat.typeCategoryValue}-${cat.subCategoryValue}`

                return orderableDocumentListDeskItem({
                  type: 'product',
                  title: title,
                  id: id,
                  filter: `typeCategory._ref == $typeCategoryId && subCategory._ref == $subCategoryId`,
                  params: {
                    typeCategoryId: cat.typeCategoryId,
                    subCategoryId: cat.subCategoryId
                  },
                  S,
                  context,
                })
              }),
            ])
        }),

      S.divider(),

      // Category Management section
      S.listItem()
        .title('Category Management')
        .child(
          S.list()
            .title('Categories')
            .items([
              orderableDocumentListDeskItem({
                type: 'typeCategory',
                title: 'Type Categories',
                id: 'orderable-type-categories',
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'subCategory',
                title: 'Sub Categories',
                id: 'orderable-sub-categories',
                S,
                context,
              }),
            ])
        ),

      S.divider(),

      // All other document types
      ...S.documentTypeListItems().filter(
        (listItem) => !['product', 'typeCategory', 'subCategory'].includes(listItem.getId())
      ),
    ])
