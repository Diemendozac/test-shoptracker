import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID     = process.env.R2_ACCOUNT_ID     || ''
const R2_ACCESS_KEY_ID  = process.env.R2_ACCESS_KEY_ID  || ''
const R2_SECRET_KEY     = process.env.R2_SECRET_ACCESS_KEY || ''
const BUCKET            = process.env.R2_BUCKET_NAME    || ''
const PUBLIC_URL        = (process.env.R2_PUBLIC_URL    || '').replace(/\/$/, '')

// R2 is optional — if env vars are missing the client won't be used.
export const r2Configured =
  Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_KEY && BUCKET && PUBLIC_URL)

const r2Client = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_KEY,
      },
    })
  : null

export async function mirrorUrlToR2(
  sourceUrl: string,
  key: string,
  contentType: string,
): Promise<string | null> {
  if (!r2Client || !r2Configured) return null
  try {
    // Facebook CDN (fbcdn.net) requires Referer to serve media cross-origin.
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    }
    if (sourceUrl.includes('fbcdn.net') || sourceUrl.includes('facebook.com')) {
      headers['Referer'] = 'https://www.facebook.com/'
      headers['Origin']  = 'https://www.facebook.com'
    }
    const response = await fetch(sourceUrl, {
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }))
    return `${PUBLIC_URL}/${key}`
  } catch {
    // Never break the job because of a storage failure.
    return null
  }
}

export function adMediaKey(
  storeDomain: string,
  adId: string,
  type: 'thumbnail' | 'video',
): string {
  const safeDomain = storeDomain.replace(/\./g, '-')
  const ext = type === 'thumbnail' ? 'jpg' : 'mp4'
  return `ads/${type}s/${safeDomain}/${adId}.${ext}`
}
