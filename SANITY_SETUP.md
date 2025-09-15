# Sanity Setup for Noon Catering (No Yuki)

## New Sanity Project Details

- **Project ID**: `6xwbxo3s`
- **Project Name**: "Noon Catering"
- **Dataset**: `production`
- **Organization**: Joël Mik
- **Visibility**: Public (world readable)

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Sanity Configuration (New Project without Yuki)
NEXT_PUBLIC_SANITY_PROJECT_ID=6xwbxo3s
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-02-13
NEXT_PUBLIC_SANITY_API_TOKEN=your_api_token_here

# Other environment variables (copy from your existing deployment)
MOLLIE_LIVE_API_KEY=your_mollie_key
CRON_SECRET=your_cron_secret
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### 2. Create Sanity API Token

1. Go to [Sanity Management](https://www.sanity.io/manage/project/6xwbxo3s)
2. Navigate to "API" section
3. Create a new token with:
   - **Name**: "Noon Catering API"
   - **Permissions**: "Editor" (or "Maintainer" for production)
4. Copy the token and update your environment variables

### 3. Update Deployment Configuration

For Vercel deployment, update these environment variables in your Vercel dashboard:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` → `6xwbxo3s`
- `NEXT_PUBLIC_SANITY_DATASET` → `production`
- `NEXT_PUBLIC_SANITY_API_TOKEN` → (your new API token)

### 4. Schema Deployment

The schema will be automatically deployed when you first run the Sanity Studio:

```bash
npm run dev
# Then visit http://localhost:3000/studio
```

### 5. Data Migration (Optional)

If you need to migrate data from the old project:

1. Export data from old project:
   ```bash
   # Set old project ID temporarily
   NEXT_PUBLIC_SANITY_PROJECT_ID=old_project_id npx sanity dataset export production backup.tar.gz
   ```

2. Import to new project:
   ```bash
   # Set new project ID
   NEXT_PUBLIC_SANITY_PROJECT_ID=6xwbxo3s npx sanity dataset import backup.tar.gz production
   ```

## What Changed

- ✅ Removed all Yuki integration fields from invoice schema
- ✅ Removed Yuki API imports and calls from all files
- ✅ Created new clean Sanity project without Yuki data/fields
- ✅ Updated schema to work without Yuki dependencies

## Project Management

- **Project URL**: https://www.sanity.io/manage/project/6xwbxo3s
- **Studio URL**: http://localhost:3000/studio (local development)
- **Studio URL**: https://your-domain.com/studio (production)


