import mongoose from "mongoose";
import subCategory from "../models/subCategoryModel.js";

const data = [
    //Women
    { title: "tops", categoryId: "67efde61fe69d7687e195ba2" },
    { title: "bottoms", categoryId: "67efde61fe69d7687e195ba2" },
    { title: "underwear", categoryId: "67efde61fe69d7687e195ba2" },
    { title: "outerwear", categoryId: "67efde61fe69d7687e195ba2" },
    { title: "shoes", categoryId: "67efde61fe69d7687e195ba2" },

    //Men
    { title: "tops", categoryId: "67efde61fe69d7687e195ba1" },
    { title: "bottoms", categoryId: "67efde61fe69d7687e195ba1" },
    { title: "underwear", categoryId: "67efde61fe69d7687e195ba1" },
    { title: "outerwear", categoryId: "67efde61fe69d7687e195ba1" },
    { title: "shoes", categoryId: "67efde61fe69d7687e195ba1" },

    //Accessories
    { title: "necklace", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "watches", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "rings", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "earrings", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "bracelets", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "pins", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "charms", categoryId: "67efde61fe69d7687e195ba4" },
    { title: "other", categoryId: "67efde61fe69d7687e195ba4" },

]

export const seederSubCategory = async () => {
    try {
        await subCategory.deleteMany();
        await subCategory.insertMany(data);
        console.log("✅ Categories seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding users:", error);
    }
}