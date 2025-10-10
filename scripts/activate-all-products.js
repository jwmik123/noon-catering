import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET || !process.env.SANITY_API_TOKEN) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN')
  console.error('\nAdd SANITY_API_TOKEN to your .env.local file')
  console.error('Get a token from: https://sanity.io/manage')
  process.exit(1)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function activateAllProducts() {
  console.log('🚀 Setting all products as active...\n')

  try {
    const products = await client.fetch(
      `*[_type == "product"] { _id, name, active }`
    )
    console.log(`Found ${products.length} products\n`)

    let updateCount = 0
    let skipCount = 0

    for (const product of products) {
      if (product.active === true) {
        console.log(`  ⏭️  ${product.name}: Already active`)
        skipCount++
        continue
      }

      try {
        await client
          .patch(product._id)
          .set({ active: true })
          .commit()

        console.log(`  ✅ ${product.name}: Set to active`)
        updateCount++
      } catch (error) {
        console.log(`  ❌ ${product.name}: Failed - ${error.message}`)
      }
    }

    console.log('\n📊 Summary:')
    console.log(`  ✅ Updated: ${updateCount}`)
    console.log(`  ⏭️  Already active: ${skipCount}`)
    console.log(`  📋 Total: ${products.length}`)
    console.log('\n✨ All products are now active!')

  } catch (error) {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  }
}

activateAllProducts()
