import mongoose from "mongoose";

const sellerTransactionFileds = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orders",
        default: null
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers",
        default: null
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        default: null
    },
    price: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ["withdraw", "paidByUser", "deliveryCharges"],
        default: "paidByUser"
    },
    isWithdrwal: {
        type: String,
        enum: ["completed", "no", "requested"],
        default: "no",
    },
    gender: {
        type: String,
        default: null
    },
    transactionId: {
        type: String,
        default: null
    },
    age: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["completed", "inProgress"],
        default: "completed",
    },
}, { timestamps: true, versionKey: false });

const sellerTransactions = mongoose.model("sellerTransactions", sellerTransactionFileds);

export default sellerTransactions;