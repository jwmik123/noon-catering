# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint validation
- `npm start` - Start production server

## Architecture Overview

This is a **Next.js 15 full-stack catering application** using App Router with React 19. The application is deployed on Vercel with cron jobs and uses Sanity as a headless CMS for all data storage.

### Tech Stack
- **Frontend**: Next.js App Router, React 19, TailwindCSS + shadcn/ui
- **Backend**: Next.js API routes (serverless functions)
- **Data**: Sanity CMS (no traditional database)
- **Payments**: Mollie with webhook integration
- **Email**: Resend + React Email templates
- **SMS**: Twilio
- **PDF**: React-PDF for invoices/quotes

### Core Business Logic

**6-Step Ordering Wizard**: The main application flow is a multi-step sandwich ordering system:
1. Quantity selection (15 minimum)
2. Product selection (custom vs variety packs)  
3. Order summary with modifications
4. Delivery scheduling and address
5. Contact/company information
6. Payment processing via Mollie

**Data Flow**: Orders → Quotes (Sanity) → Payments (Mollie) → Invoices (Generated PDFs) → Automated follow-up emails

### Key Architecture Patterns

**Modular Component Design**: Recently refactored from monolithic to modular architecture (87% code reduction documented in `/docs/MODULAR_ARCHITECTURE.md`). Components follow single responsibility principle.

**Custom Hooks Pattern**: No external state management library. Uses custom hooks:
- `useOrderForm.js` - Form state management across wizard steps
- `useOrderValidation.js` - Real-time validation logic

**Server Actions**: Located in `/app/actions/` for form submissions and data mutations.

### Important Directories

- `/app/components/wizard/` - Main wizard container
- `/app/components/steps/` - Individual wizard steps (6 components)
- `/app/components/emails/` - React Email templates
- `/app/api/` - API routes including webhooks and cron jobs
- `/sanity/` - CMS configuration, schemas, and queries
- `/docs/` - Comprehensive architecture documentation

### Data Models (Sanity)

- `productType.js` - Sandwich products with categories, pricing, dietary info
- `quoteType.js` - Customer quotes with order details
- `invoiceType.js` - Generated invoices with payment status

### API Endpoints

- `/api/create-payment` - Initialize Mollie payments
- `/api/create-invoice` - Generate and store invoices  
- `/api/webhooks/mollie` - Handle payment status updates
- `/api/cron/send-invoice-emails` - Daily automated email sending (8 AM via Vercel cron)

### Environment Setup

Uses Sanity for content management accessible at `/studio`. All sensitive configuration through environment variables (see `env.example`).

### Testing & Quality

Run `npm run lint` before committing. The codebase follows ESLint standards and uses TailwindCSS for consistent styling.