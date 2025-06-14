import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",

        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "sellers",

        },
        totalItems: {
            type: Number,
            default: 0
        },
        title: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        images: {
            type: [String],
        },
        condition: {
            type: String,
            enum: ["new", "likeNew", "used", "worn", "good", "excellent"],
            default: "new"
        },
        season: {
            type: String,
            enum: ["winter", "summer", "spring", "autumn", "rainy", "all"],
            default: "all"
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            default: null
        },
        subCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subcategories",
            default: null
        },
        childSubCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subcategories",
            default: null
        },
        gender: {
            type: String,
            enum: ["male", "female", "unisex"],
            default: "male"
        },
        parcelSizeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "parcelsizes",
            default: null
        },
        shippingFromAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "addressses",
            default: null
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "brands",
            default: null
        },
        styleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            default: null
        },
        hashtagIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "hashtags",
            default: null
        },
        status: {
            type: String,
            enum: ["available", "sold", "outOfStock", "upcomming", "deleted","notApproved"],
            default: "available",
        },
        //for filter 
        sizes: {
            type: Array,
            default: [],
        },
        prices: {
            type: [Number],
            default: [],
        },
        colors: {
            type: Array,
            default: [],
        },
        // [type: String,
        // enum: ["xs", "s", "m", "l", "xl", "xxl"], // Include all valid sizes here
        // default: "s"], // An array of size objects with stock
    },
    { timestamps: true, versionKey: false }
);

const Product = mongoose.model("products", productSchema);

export default Product;
