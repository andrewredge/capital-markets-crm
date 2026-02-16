import { Metadata } from 'next'
import { DealsPageClient } from '@/components/deals/deals-page-client'

export const metadata: Metadata = { title: 'Deals' }

export default function DealsPage() {
  return <DealsPageClient />
}
