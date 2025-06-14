import mongoose from "mongoose";

const orderFileds = new mongoose.Schema({
    orderId: {
        type: String,
        default: ""
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    sellerIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers",
    }],
    razorpayOrderId: {
        type: String,
        default: ""
    },
    // history: {
    //     type: [Object],
    // },
    totalBillAmt: {
        type: String,
        default: ""
    },
    paymentType: {
        type: String,
        default: ""

    },
    isExpresShipping: {
        type: String,
        default: ""

    },
    totalShippingCharges: {
        type: String,
        default: ""

    },
    deliveryAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "addressses",
    },
    // sellerStatus: {
    //     type: String,
    //     enum: ["received", "ready", "Shipped", "receivedAtLocalHub", "PrepareForShipment", "Pickup", "OutForDelivery"],
    //     default: "received",
    // },
    // buyerStatus: {
    //     type: String,
    //     enum: ["available", "sold", "outOfStock", "upcomming", "active", "inactive", "deleted"],
    //     default: "active",
    // },
    paymentId: {
        type: String,
        default: null
    },
    paymentSignature: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ["completed", "pending", "failed", "upcomming", "active", "inactive", "deleted", "cashOnDelivery"],
        default: "pending",
    },
    status: {
        type: String,
        enum: ["inProcess", "paymentFailed", "received", "ready", "shipped", "receivedAtLocalHub", "PrepareForShipment", "Pickup", "OutForDelivery","cancel","delivered"],
        default: "inProcess",
    },
    // DeliveredDate: {
    //     type: Date,
    //     default: ""
    // },
}, { timestamps: true, versionKey: false });

const Order = mongoose.model("orders", orderFileds);

export default Order;

/*
Status
inProcess/received
Buyer = In Transit
seller =Order received
ready
Buyer = In Transit
seller =Awaiting shipment
shipped
Buyer = In Transit
seller =Shipped to local hub
*/