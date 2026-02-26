/**
 * Format bytes to human-readable size string.
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	const size = bytes / 1024 ** i
	return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Get a display-friendly icon name based on MIME type.
 * Returns a Lucide icon name string for use in components.
 */
export function getFileIconType(mimeType: string): 'pdf' | 'image' | 'spreadsheet' | 'presentation' | 'text' | 'file' {
	if (mimeType === 'application/pdf') return 'pdf'
	if (mimeType.startsWith('image/')) return 'image'
	if (
		mimeType.includes('spreadsheet') ||
		mimeType.includes('excel') ||
		mimeType === 'text/csv'
	) return 'spreadsheet'
	if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
	if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('word')) return 'text'
	return 'file'
}
