import Papa from 'papaparse'
import { read, utils } from 'xlsx'

export interface ParsedFile {
	headers: string[]
	rows: string[][]
	fileName: string
}

export function parseCSV(file: File): Promise<ParsedFile> {
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			skipEmptyLines: true,
			complete(results) {
				const data = results.data as string[][]
				if (data.length < 2) {
					reject(new Error('File must contain a header row and at least one data row'))
					return
				}
				resolve({
					headers: data[0]!,
					rows: data.slice(1),
					fileName: file.name,
				})
			},
			error(err) {
				reject(new Error(`Failed to parse CSV: ${err.message}`))
			},
		})
	})
}

export async function parseExcel(file: File): Promise<ParsedFile> {
	const buffer = await file.arrayBuffer()
	const workbook = read(buffer, { type: 'array' })
	const sheetName = workbook.SheetNames[0]
	if (!sheetName) {
		throw new Error('Excel file has no sheets')
	}
	const sheet = workbook.Sheets[sheetName]!
	const data: string[][] = utils.sheet_to_json(sheet, { header: 1, defval: '' })

	if (data.length < 2) {
		throw new Error('File must contain a header row and at least one data row')
	}

	return {
		headers: data[0]!.map(String),
		rows: data.slice(1).map((row) => row.map(String)),
		fileName: file.name,
	}
}

export async function parseFile(file: File): Promise<ParsedFile> {
	const ext = file.name.split('.').pop()?.toLowerCase()
	if (ext === 'csv') {
		return parseCSV(file)
	}
	if (ext === 'xlsx' || ext === 'xls') {
		return parseExcel(file)
	}
	throw new Error(`Unsupported file type: .${ext}. Please use .csv, .xlsx, or .xls`)
}
