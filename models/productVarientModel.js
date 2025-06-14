import mongoose, { Schema } from "mongoose";

const productVarientFileds = new mongoose.Schema({
    price: {
        type: Number,
        min: 0,
        default:0
    },
    totalQuantity: {
        type: Number,
        min: 0,
        default: 0
    },
    availableQuantity: {
        type: Number,
        min: 0,
        default: 0
    },
    color: {
        type: String        
    },
    size: {
        type: String,
        enum: ["xs", "s", "m", "l", "xl", "xxl"], // Include all valid sizes here
        default:"s"
    },
    status: {
        type: String,
        enum: ["available", "sold", "outOfStock", "upcomming", "deleted"],
        default: "available",
    },
    remark: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: "products", default: null },
},
    { timestamps: true },
    { versionKey: false }
);

const productVarientModel = mongoose.model("productvarients", productVarientFileds);

export default productVarientModel;