const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Inicialización lazy para que dotenv ya haya cargado las vars
let _client = null;
function getClient() {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

async function uploadBuffer(buffer, originalname, mimetype, folder = 'recursos') {
  const ext = path.extname(originalname) || '';
  const key = `${folder}/${uuidv4()}${ext}`;

  await getClient().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ContentDisposition: `attachment; filename="${encodeURIComponent(originalname)}"`,
  }));

  return { key, url: `${process.env.R2_PUBLIC_URL}/${key}` };
}

async function getDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn });
}

async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
}

module.exports = { uploadBuffer, getDownloadUrl, deleteObject };
