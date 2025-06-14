import mongoose from "mongoose";

const cartFileds = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers",
    },
    productVarientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productvarients",
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    // price: {
    //     type: Number,
    //     min: 1,
    //     default: 1
    // },
    // status: {
    //     type: String,
    //     enum: ["available", "sold", "outOfStock", "upcomming", "active", "inactive", "deleted"],
    //     default: "active",
    // },
}, { timestamps: true, versionKey: false });

const Cart = mongoose.model("carts", cartFileds);

export default Cart;