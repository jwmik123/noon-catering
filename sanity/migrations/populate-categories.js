/**
 * Migration script to populate initial Type Categories and Sub Categories
 *
 * Run this script once to migrate from hardcoded categories to reference-based categories.
 *
 * Usage:
 * 1. Make sure you have @sanity/client installed
 * 2. Run: node sanity/migrations/populate-categories.js
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, '../../.env.local')
dotenv.config({ path: envPath })

// Verify configuration
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
  process.exit(1)
}
if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ Missing SANITY_API_TOKEN in .env.local')
  process.exit(1)
}

console.log(`📋 Using project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`)
console.log(`📋 Using dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}\n`)

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN, // You'll need a token with write permissions
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Define the categories to migrate
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

async function populateCategories() {
  console.log('🚀 Starting category migration...\n')

  try {
    // Create Type Categories
    console.log('📁 Creating Type Categories...')
    const typeCategoryDocs = []

    for (let i = 0; i < typeCategories.length; i++) {
      const cat = typeCategories[i]
      const doc = {
        _type: 'typeCategory',
        name: cat.name,
        value: {
          _type: 'slug',
          current: cat.value,
        },
        description: cat.description,
        active: true,
        orderRank: `a${i}`, // Simple ordering
      }

      const result = await client.create(doc)
      typeCategoryDocs.push({ ...cat, _id: result._id })
      console.log(`  ✅ Created: ${cat.name} (${result._id})`)
    }

    // Create Sub Categories
    console.log('\n📁 Creating Sub Categories...')
    const subCategoryDocs = []

    for (let i = 0; i < subCategories.length; i++) {
      const cat = subCategories[i]
      const doc = {
        _type: 'subCategory',
        name: cat.name,
        value: {
          _type: 'slug',
          current: cat.value,
        },
        description: cat.description,
        active: true,
        orderRank: `a${i}`, // Simple ordering
      }

      const result = await client.create(doc)
      subCategoryDocs.push({ ...cat, _id: result._id })
      console.log(`  ✅ Created: ${cat.name} (${result._id})`)
    }

    // Update existing products to use references
    console.log('\n🔄 Updating existing products...')

    // Fetch all products
    const products = await client.fetch(`*[_type == "product"]{_id, typeCategory, subCategory}`)
    console.log(`  Found ${products.length} products to update`)

    // Batch all updates into a single transaction
    const transaction = client.transaction()
    let updatedCount = 0

    for (const product of products) {
      let needsUpdate = false

      // Find matching type category
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

      // Find matching sub category
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

      if (needsUpdate) {
        updatedCount++
      }
    }

    // Commit all updates at once
    if (updatedCount > 0) {
      console.log(`  Committing ${updatedCount} product updates...`)
      await transaction.commit()
      console.log(`  ✅ All products updated!`)
    }

    console.log(`\n✨ Migration completed successfully!`)
    console.log(`   - Created ${typeCategoryDocs.length} type categories`)
    console.log(`   - Created ${subCategoryDocs.length} sub categories`)
    console.log(`   - Updated ${updatedCount} products`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run the migration
populateCategories()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })
