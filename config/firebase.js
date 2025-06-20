import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your service account key file
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const storage = admin.storage();

console.log("[Firebase] Initialized with config:", {
  projectId: app.options.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

export const auth = admin.auth();
export { storage };
export default admin;
