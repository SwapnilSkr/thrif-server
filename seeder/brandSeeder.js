import mongoose from "mongoose";
import brands from "../models/brandModel.js";

const data = [
    { title: "Nike", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832584-image.jpg", isFeaturedBrand: true, isTopBrand: true },
    { title: "Adidas", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832572-image%20(5).jpg", isTopBrand: true },
    { title: "Zara", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832577-image%20(9).jpg", isTopBrand: true },
    { title: "Puma", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832563-image%20(1).jpg", isFeaturedBrand: true },
    { title: "Off-White", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832576-image%20(7).jpg", isTopBrand: true },
    { title: "Urban Outfitters", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832577-image%20(8).jpg", isTopBrand: true },
    { title: "Uniqlo", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832575-image%20(6).jpg", isTopBrand: true },
    { title: "Forever 21", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832583-image%20(10).jpg", isTopBrand: true },
    { title: "Newme", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832583-image%20(11).jpg", isTopBrand: true },
    { title: "Mango", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832570-image%20(2).jpg", isFeaturedBrand: true },
    { title: "H&M", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832571-image%20(3).jpg", isFeaturedBrand: true },
    { title: "New Balance", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832571-image%20(4).jpg", isFeaturedBrand: true },
    { title: "Levis", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832583-image%20(13).jpg" },
    { title: "Supreme", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1744786832583-image%20(12).jpg" },

]

export const seederBrands = async () => {
    try {
        // await brands.deleteMany();
        await brands.insertMany(data);
        console.log("✅ Brands seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
} 