import { Metadata } from 'next'
import { PipelinesSettingsClient } from '@/components/settings/pipelines-settings-client'

export const metadata: Metadata = { title: 'Pipeline Settings' }

export default function PipelineSettingsPage() {
  return <PipelinesSettingsClient />
}
