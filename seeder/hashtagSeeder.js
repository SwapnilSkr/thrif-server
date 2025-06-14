import mongoose from "mongoose";
import hashtags from "../models/hashtagModel.js";

const data = [
    { title: "#fashion" },
    { title: "#style" },
    { title: "#streetwear" },
    { title: "#trendy" },
    { title: "#ootd" }, // Outfit of the day
    { title: "#clothingbrand" },
];

export const seederHashtag = async () => {
    try {
        await hashtags.deleteMany();
        await hashtags.insertMany(data);
        console.log("✅ Hashtag seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
}