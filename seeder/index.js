import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedStyles } from "./styleSeeder.js";
import { seederCategory } from "./categorySeeder.js";
import { seederHashtag } from "./hashtagSeeder.js";
import { seederBrands } from "./brandSeeder.js";
import { seederSubCategory } from "./subCategory.js";
import { seederBanner } from "./bannerSeeder.js";
import { seederAdmin } from "./adminSeeder.js";
import { seederParcel } from './parcelSizesSeeder.js';

dotenv.config(); // Load environment variables

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {});

        console.log("🚀 Connected to MongoDB");

        // await seedStyles();
        // await seederCategory();
        // await seederHashtag();
        // await seederBrands();
        // await seederBanner();
        // await seederSubCategory();
        // await seederAdmin();
        // await seederParcel();
        console.log("🎉 Seeding completed!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

// Run the seeder
seedDatabase();
