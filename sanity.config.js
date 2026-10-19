'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.jsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import {
  SendInvoiceToAccountantAction,
  SendInvoiceToBothAction,
  SendInvoiceToCustomerAction,
} from './sanity/actions/SendInvoiceAction'
import {
  SendCreditNoteToAccountantAction,
  SendCreditNoteToBothAction,
  SendCreditNoteToCustomerAction,
} from './sanity/actions/SendCreditNoteAction'
import {SendPeppolAction} from './sanity/actions/SendPeppolAction'
import {CancelOrderAction} from './sanity/actions/CancelOrderAction'
import {DownloadCreditNoteAction, DownloadInvoiceAction} from './sanity/actions/DownloadInvoiceAction'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'invoice') {
        return [
          ...prev,
          SendInvoiceToBothAction,
          SendInvoiceToCustomerAction,
          SendInvoiceToAccountantAction,
          SendCreditNoteToBothAction,
          SendCreditNoteToCustomerAction,
          SendCreditNoteToAccountantAction,
          SendPeppolAction,
          DownloadInvoiceAction,
          DownloadCreditNoteAction,
          CancelOrderAction,
        ]
      }
      return prev
    },
  },
})
