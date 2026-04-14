import 'dotenv/config';
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

await r2.send(new PutBucketCorsCommand({
  Bucket: process.env.R2_BUCKET_NAME!,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: ['http://localhost:5173', 'https://*'],
        AllowedMethods: ['GET', 'PUT'],
        AllowedHeaders: ['*'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
}));

console.log(`R2 CORS configured on bucket: ${process.env.R2_BUCKET_NAME}`);
