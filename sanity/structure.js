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
          // Fetch unique category combinations
          const products = await context.getClient({ apiVersion: '2024-01-01' }).fetch(
            `*[_type == "product" && defined(typeCategory) && defined(subCategory)]{"typeCategory": typeCategory, "subCategory": subCategory}`
          )

          // Create unique combinations using a Map
          const categoryMap = new Map()
          products.forEach(p => {
            const key = `${p.typeCategory}-${p.subCategory}`
            if (!categoryMap.has(key)) {
              categoryMap.set(key, p)
            }
          })

          // Define subcategory order
          const subCategoryOrder = ['meat', 'chicken', 'fish', 'veggie', 'vegan']

          // Convert to array and sort
          const validCategories = Array.from(categoryMap.values())
            .sort((a, b) => {
              if (a.typeCategory !== b.typeCategory) {
                return a.typeCategory.localeCompare(b.typeCategory)
              }
              // Sort by predefined subcategory order
              const indexA = subCategoryOrder.indexOf(a.subCategory)
              const indexB = subCategoryOrder.indexOf(b.subCategory)
              return indexA - indexB
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
                const title = `${cat.typeCategory} - ${cat.subCategory}`
                const id = `orderable-products-${cat.typeCategory}-${cat.subCategory}`

                return orderableDocumentListDeskItem({
                  type: 'product',
                  title: title,
                  id: id,
                  filter: `typeCategory == $typeCategory && subCategory == $subCategory`,
                  params: {
                    typeCategory: cat.typeCategory,
                    subCategory: cat.subCategory
                  },
                  S,
                  context,
                })
              }),
            ])
        }),

      S.divider(),

      // All other document types
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== 'product'
      ),
    ])
