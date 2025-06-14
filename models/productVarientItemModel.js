import mongoose, { Schema } from "mongoose";

const productVarientFiledItems = new mongoose.Schema({
    productId: { type: Schema.Types.ObjectId, ref: "products", default: null },
    productVarientId: { type: Schema.Types.ObjectId, ref: "productvarients", default: null },
    serialNumber: {
        type: String
    },
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    // quantity: {
    //     type: Number,
    //     min: 0,
    //     default: 0
    // },
    color: {
        type: String
    },
    size: {
        type: String,
        enum: ["xs", "s", "m", "l", "xl", "xxl"], // Include all valid sizes here
        default: "s"
    },
    status: {
        type: String,
        enum: ["available", "sold", "outOfStock", "upcomming", "deleted"],
        default: "available",
    },
    remark: { type: String },
},
    { timestamps: true },
    { versionKey: false }
);

const productVarientItemsModel = mongoose.model("productvarientitems", productVarientFiledItems);

export default productVarientItemsModel;