
// require('dotenv').config();
import express from "express";
import upload from "../helpers/multer.js";
// const upload = require('./multer');
import uploadFileToS3 from "../helpers/upload.js";
// const { uploadFileToS3 } = require('./upload');
// const app = express(); 
const router = express.Router();

router.post('/upload', upload.array('images', 14), async (req, res) => {
    try {
        const folder = 'style';
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadPromises = files.map(file => uploadFileToS3(file, folder));
        const uploadedUrls = await Promise.all(uploadPromises);

        res.status(200).json({ message: 'Files uploaded successfully', urls: uploadedUrls });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(400).json({ error: 'Error uploading files' });
    }
});

export default router;