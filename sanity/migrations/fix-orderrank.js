/**
 * Fix invalid orderRank values in categories
 *
 * The orderable-document-list plugin requires proper LexoRank values.
 * This script removes invalid orderRank fields and lets the plugin regenerate them.
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

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

console.log('🔧 Fixing orderRank values...\n')

async function fixOrderRanks() {
  try {
    // Fix type categories
    console.log('📁 Fixing Type Categories...')
    const typeCategories = await client.fetch(`*[_type == "typeCategory"]{_id, name, orderRank}`)
    console.log(`  Found ${typeCategories.length} type categories`)

    const typeTransaction = client.transaction()
    let typeFixed = 0

    for (const cat of typeCategories) {
      if (cat.orderRank) {
        // Remove invalid orderRank - let the plugin regenerate it
        typeTransaction.patch(cat._id, { unset: ['orderRank'] })
        typeFixed++
        console.log(`  ✅ Removed orderRank from: ${cat.name}`)
      }
    }

    if (typeFixed > 0) {
      await typeTransaction.commit()
      console.log(`  Committed ${typeFixed} fixes`)
    }

    // Fix sub categories
    console.log('\n📁 Fixing Sub Categories...')
    const subCategories = await client.fetch(`*[_type == "subCategory"]{_id, name, orderRank}`)
    console.log(`  Found ${subCategories.length} sub categories`)

    const subTransaction = client.transaction()
    let subFixed = 0

    for (const cat of subCategories) {
      if (cat.orderRank) {
        // Remove invalid orderRank
        subTransaction.patch(cat._id, { unset: ['orderRank'] })
        subFixed++
        console.log(`  ✅ Removed orderRank from: ${cat.name}`)
      }
    }

    if (subFixed > 0) {
      await subTransaction.commit()
      console.log(`  Committed ${subFixed} fixes`)
    }

    console.log('\n✨ Done! The Sanity Studio will regenerate proper orderRank values.')
    console.log('   Reload your Studio at http://localhost:3000/studio\n')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

fixOrderRanks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
