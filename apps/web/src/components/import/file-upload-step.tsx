'use client'

import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { parseFile, type ParsedFile } from '@/lib/parse-file'

interface FileUploadStepProps {
	onFileParsed: (data: ParsedFile) => void
}

export function FileUploadStep({ onFileParsed }: FileUploadStepProps) {
	const [dragOver, setDragOver] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [parsing, setParsing] = useState(false)
	const [selectedFile, setSelectedFile] = useState<{ name: string; rows: number; cols: number } | null>(null)

	const handleFile = useCallback(
		async (file: File) => {
			setError(null)
			setParsing(true)
			try {
				const parsed = await parseFile(file)
				setSelectedFile({
					name: parsed.fileName,
					rows: parsed.rows.length,
					cols: parsed.headers.length,
				})
				onFileParsed(parsed)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to parse file')
				setSelectedFile(null)
			} finally {
				setParsing(false)
			}
		},
		[onFileParsed],
	)

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragOver(false)
			const file = e.dataTransfer.files[0]
			if (file) handleFile(file)
		},
		[handleFile],
	)

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleFile(file)
		},
		[handleFile],
	)

	const clearFile = useCallback(() => {
		setSelectedFile(null)
		setError(null)
	}, [])

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold">Upload File</h3>
				<p className="text-sm text-muted-foreground">Upload a CSV or Excel file containing your contacts.</p>
			</div>

			{selectedFile ? (
				<Card>
					<CardContent className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<FileSpreadsheet className="h-8 w-8 text-primary" />
							<div>
								<p className="font-medium">{selectedFile.name}</p>
								<p className="text-sm text-muted-foreground">
									{selectedFile.rows} rows, {selectedFile.cols} columns
								</p>
							</div>
						</div>
						<Button variant="ghost" size="icon" onClick={clearFile}>
							<X className="h-4 w-4" />
						</Button>
					</CardContent>
				</Card>
			) : (
				<label
					className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer ${
						dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
					}`}
					onDragOver={(e) => {
						e.preventDefault()
						setDragOver(true)
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
				>
					<Upload className="h-10 w-10 text-muted-foreground mb-4" />
					<p className="text-sm font-medium">Drop your file here, or click to browse</p>
					<p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
					<input
						type="file"
						accept=".csv,.xlsx,.xls"
						className="hidden"
						onChange={handleInputChange}
						disabled={parsing}
					/>
				</label>
			)}

			{error && <p className="text-sm text-destructive">{error}</p>}
			{parsing && <p className="text-sm text-muted-foreground">Parsing file...</p>}
		</div>
	)
}
