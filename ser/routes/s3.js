const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configure S3 client using environment variables
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

router.post('/presigned-url', async (req, res) => {
    try {
        const { fileName, fileType } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'fileName and fileType are required' });
        }

        // Clean filename and create unique key
        const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const key = `uploads/${uniqueFileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: fileType
        });

        // Generate Pre-Signed URL valid for 5 minutes (300 seconds)
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        // Construct the public URL assuming the bucket is configured for public access
        const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        res.json({ presignedUrl, fileUrl, key });
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        res.status(500).json({ error: 'Failed to generate pre-signed URL' });
    }
});

router.get('/documents', async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET_NAME
        });

        const data = await s3Client.send(command);
        const contents = data.Contents || [];
        
        const files = contents.map(item => ({
            key: item.Key,
            lastModified: item.LastModified,
            size: item.Size,
            fileName: item.Key.split('/').pop()
        }));

        res.json(files);
    } catch (error) {
        console.error('Error listing objects:', error);
        res.status(500).json({ error: 'Failed to list documents' });
    }
});

router.get('/download-url', async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ error: 'key is required' });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

        res.json({ presignedUrl });
    } catch (error) {
        console.error('Error generating pre-signed download URL:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});

router.delete('/delete', async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ error: 'key is required' });
        }

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

module.exports = router;
