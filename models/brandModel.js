import mongoose from "mongoose"

const brandFields = new mongoose.Schema({
    title: { type: String, default: "" },
    imageURL: { type: String, default: "" },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    isFeaturedBrand: {
        type: Boolean,
        default: false
    },
    isTopBrand: {
        type: Boolean,
        default: false
    },
}, { timestamps: true },
    { versionKey: false });

const brands = mongoose.model("brands", brandFields);

export default brands;