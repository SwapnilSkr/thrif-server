import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
        },
        subcategoryId: {//
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            default: null
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        imageURL: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
    },
    { timestamps: true },
    { versionKey: false }
);

const SubCategory = mongoose.model("subcategories", subCategorySchema);

export default SubCategory;
