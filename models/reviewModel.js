import mongoose, { Schema } from "mongoose";

const sellerFields = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId, ref: "users", default: null
    },
    sellerId: {
        type: Schema.Types.ObjectId, ref: "sellers", default: null
    },
    productId: {
        type: Schema.Types.ObjectId, ref: "products", default: null
    },
    productVarientItemId: {
        type: Schema.Types.ObjectId, ref: "productvarientitems", default: null
    },
    reviewsTitle: {
        type: String
    },
    serialNumber: {
        type: String
    },
    reviewsDescription: {
        type: String
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    photos: {
        type: [String]
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    helpfullYes: {
        type: [Schema.Types.ObjectId], ref: "users", default: []
    },
    helpfullNo: {
        type: [Schema.Types.ObjectId], ref: "users", default: []
    },
}, { timestamps: true },
    { versionKey: false });

const seller = mongoose.model("reviews", sellerFields);

export default seller;