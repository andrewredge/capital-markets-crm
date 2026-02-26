import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env.js'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
	if (!s3Client) {
		if (!env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
			throw new Error('S3 is not configured — set S3_ACCESS_KEY and S3_SECRET_KEY')
		}
		s3Client = new S3Client({
			region: env.S3_REGION,
			credentials: {
				accessKeyId: env.S3_ACCESS_KEY,
				secretAccessKey: env.S3_SECRET_KEY,
			},
			...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
		})
	}
	return s3Client
}

/**
 * Generate a presigned PUT URL for direct client upload.
 */
export async function getPresignedUploadUrl(
	storageKey: string,
	contentType: string,
	expiresIn = 600,
): Promise<{ url: string; storageKey: string }> {
	const client = getS3Client()
	const command = new PutObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: storageKey,
		ContentType: contentType,
	})
	const url = await getSignedUrl(client, command, { expiresIn })
	return { url, storageKey }
}

/**
 * Generate a presigned GET URL for secure download.
 */
export async function getPresignedDownloadUrl(
	storageKey: string,
	expiresIn = 3600,
): Promise<string> {
	const client = getS3Client()
	const command = new GetObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: storageKey,
	})
	return getSignedUrl(client, command, { expiresIn })
}

/**
 * Delete an object from S3.
 */
export async function deleteObject(storageKey: string): Promise<void> {
	const client = getS3Client()
	const command = new DeleteObjectCommand({
		Bucket: env.S3_BUCKET,
		Key: storageKey,
	})
	await client.send(command)
}
