import type { Metadata } from 'next'
import { ProjectsPageClient } from '@/components/projects/projects-page-client'

export const metadata: Metadata = {
	title: 'Projects | Capital Markets CRM',
	description: 'Manage mining projects and assets.',
}

export default function ProjectsPage() {
	return <ProjectsPageClient />
}
