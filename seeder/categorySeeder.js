import mongoose from "mongoose";
import category from "../models/categoryModel.js";

const data = [
    { title: "Men's Clothing", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1749709718725-52b688dc51d73a146a3e9c4690bdd7adeae16b8b.png", hashColor: "#0A0A0A" },
    { title: "Women's Clothing", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1749709164225-new dresses.png", hashColor: "#FF2442" },
    { title: "Hangbags", imageURL: "https://example.com/shoes.jpg", hashColor: "#00935B" },
    { title: "Winterwear", imageURL: "https://example.com/accessories.jpg", hashColor: "#006993" },
    { title: "Beauty", imageURL: "https://example.com/sportswear.jpg", hashColor: "#DF311E" },
    { title: "Shoes", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1749709651123-0007d40a2d69581a5a684c739290c70eb4c68925.png", hashColor: "#D252FD" },
    { title: "Accessories", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1749709164224-image (1).png", hashColor: "#E87F14" },
    { title: "Sportswear", imageURL: "https://triffstorage.blr1.cdn.digitaloceanspaces.com/style/1749709651123-0007d40a2d69581a5a684c739290c70eb4c68925.png", hashColor: "#AAAAAA" }
]

export const seederCategory = async () => {
    try {
        await category.deleteMany();
        await category.insertMany(data);
        console.log("✅ Categories seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
}