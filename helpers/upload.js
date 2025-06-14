import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import mime from "mime-types";
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
    endpoint: process.env.AWS_ENDPOINT_WITHOUT_BUCKET_NAME,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadFileToS3 = async (file, folder) => {
    const fileStream = fs.createReadStream(file.path);
    const fileKey = `${folder}/${Date.now()}-${file.originalname}`;
    const contentType = mime.lookup(file.originalname) || "application/octet-stream";
    const publicUrl = `${process.env.AWS_CDN_ENDPOINT}/${fileKey}`;

    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: fileStream,
        ContentType: contentType,
        ACL: "public-read",
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return publicUrl;
};


export default uploadFileToS3
