/**
 * Safe migration script that cleans up duplicates and migrates categories
 *
 * This script:
 * 1. Checks for existing categories
 * 2. Removes duplicates if found
 * 3. Creates missing categories
 * 4. Updates products to use references
 *
 * Usage: node sanity/migrations/cleanup-and-migrate.js
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, '../../.env.local')
dotenv.config({ path: envPath })

// Verify configuration
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

console.log(`📋 Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`)
console.log(`📋 Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}\n`)

// Define the categories we want
const typeCategories = [
  { name: 'Sandwiches', value: 'sandwiches', description: 'Fresh sandwiches made to order' },
  { name: 'Salads', value: 'salads', description: 'Fresh and healthy salads' },
  { name: 'Lunchboxes', value: 'lunchboxes', description: 'Complete lunchbox meals' },
  { name: 'Desserts', value: 'desserts', description: 'Sweet treats and beverages' },
]

const subCategories = [
  { name: 'Meat', value: 'meat', description: 'Products with meat' },
  { name: 'Chicken', value: 'chicken', description: 'Products with chicken' },
  { name: 'Fish', value: 'fish', description: 'Products with fish' },
  { name: 'Veggie', value: 'veggie', description: 'Vegetarian products' },
  { name: 'Vegan', value: 'vegan', description: 'Plant-based products' },
]

async function cleanupAndMigrate() {
  console.log('🚀 Starting safe category migration...\n')

  try {
    // Step 1: Clean up existing categories
    console.log('🧹 Step 1: Checking for existing categories...')

    const existingTypeCategories = await client.fetch(`*[_type == "typeCategory"]{_id, name, "slug": value.current}`)
    const existingSubCategories = await client.fetch(`*[_type == "subCategory"]{_id, name, "slug": value.current}`)

    console.log(`  Found ${existingTypeCategories.length} type categories`)
    console.log(`  Found ${existingSubCategories.length} sub categories`)

    // Remove duplicates - keep only the first occurrence of each value
    const typeToKeep = new Map()
    const typeToDelete = []

    existingTypeCategories.forEach(cat => {
      if (!typeToKeep.has(cat.slug)) {
        typeToKeep.set(cat.slug, cat)
      } else {
        typeToDelete.push(cat._id)
      }
    })

    const subToKeep = new Map()
    const subToDelete = []

    existingSubCategories.forEach(cat => {
      if (!subToKeep.has(cat.slug)) {
        subToKeep.set(cat.slug, cat)
      } else {
        subToDelete.push(cat._id)
      }
    })

    // Delete duplicates
    if (typeToDelete.length > 0) {
      console.log(`  🗑️  Removing ${typeToDelete.length} duplicate type categories...`)
      const transaction = client.transaction()
      typeToDelete.forEach(id => transaction.delete(id))
      await transaction.commit()
    }

    if (subToDelete.length > 0) {
      console.log(`  🗑️  Removing ${subToDelete.length} duplicate sub categories...`)
      const transaction = client.transaction()
      subToDelete.forEach(id => transaction.delete(id))
      await transaction.commit()
    }

    // Step 2: Create missing categories
    console.log('\n📁 Step 2: Creating missing categories...')

    const typeCategoryDocs = []
    for (let i = 0; i < typeCategories.length; i++) {
      const cat = typeCategories[i]
      const existing = typeToKeep.get(cat.value)

      if (existing) {
        console.log(`  ℹ️  Type category already exists: ${cat.name}`)
        typeCategoryDocs.push({ ...cat, _id: existing._id })
      } else {
        const doc = {
          _type: 'typeCategory',
          name: cat.name,
          value: { _type: 'slug', current: cat.value },
          description: cat.description,
          active: true,
          // Don't set orderRank - let orderable-document-list handle it
        }
        const result = await client.create(doc)
        typeCategoryDocs.push({ ...cat, _id: result._id })
        console.log(`  ✅ Created type category: ${cat.name}`)
      }
    }

    const subCategoryDocs = []
    for (let i = 0; i < subCategories.length; i++) {
      const cat = subCategories[i]
      const existing = subToKeep.get(cat.value)

      if (existing) {
        console.log(`  ℹ️  Sub category already exists: ${cat.name}`)
        subCategoryDocs.push({ ...cat, _id: existing._id })
      } else {
        const doc = {
          _type: 'subCategory',
          name: cat.name,
          value: { _type: 'slug', current: cat.value },
          description: cat.description,
          active: true,
          // Don't set orderRank - let orderable-document-list handle it
        }
        const result = await client.create(doc)
        subCategoryDocs.push({ ...cat, _id: result._id })
        console.log(`  ✅ Created sub category: ${cat.name}`)
      }
    }

    // Step 3: Update products
    console.log('\n🔄 Step 3: Updating products to use references...')

    const products = await client.fetch(`*[_type == "product"]{_id, typeCategory, subCategory}`)
    console.log(`  Found ${products.length} products`)

    const transaction = client.transaction()
    let updatedCount = 0

    for (const product of products) {
      let needsUpdate = false

      // Update type category if it's a string
      if (typeof product.typeCategory === 'string') {
        const typeCat = typeCategoryDocs.find(tc => tc.value === product.typeCategory)
        if (typeCat) {
          transaction.patch(product._id, {
            set: {
              typeCategory: {
                _type: 'reference',
                _ref: typeCat._id,
              }
            }
          })
          needsUpdate = true
        }
      }

      // Update sub category if it's a string
      if (typeof product.subCategory === 'string') {
        const subCat = subCategoryDocs.find(sc => sc.value === product.subCategory)
        if (subCat) {
          transaction.patch(product._id, {
            set: {
              subCategory: {
                _type: 'reference',
                _ref: subCat._id,
              }
            }
          })
          needsUpdate = true
        }
      }

      if (needsUpdate) updatedCount++
    }

    if (updatedCount > 0) {
      console.log(`  Committing ${updatedCount} product updates...`)
      await transaction.commit()
      console.log(`  ✅ All products updated!`)
    } else {
      console.log(`  ℹ️  No products need updating`)
    }

    console.log(`\n✨ Migration completed successfully!`)
    console.log(`   📦 Type categories: ${typeCategoryDocs.length}`)
    console.log(`   📦 Sub categories: ${subCategoryDocs.length}`)
    console.log(`   📄 Products updated: ${updatedCount}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
cleanupAndMigrate()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })
