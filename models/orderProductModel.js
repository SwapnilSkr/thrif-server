import mongoose from "mongoose";

const orderProductFileds = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orders",
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers",
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
    },
    productVarientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productvarients",
    },
    productVarientItemId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "productvarientitems",
    },
    productSerialNumber: {
        type: [String],
        default: []
    },
    shippingCharges: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        min: 1,
        default: 1
    },
    deliveryProgress: {
        type: Array(Object),
        default: []
    },
    status: {
        type: String,
        enum: ["order_received", "prepare_for_shipment", "shipped_by_seller", "shipment_local_hub", "out_for_delivery", "delivery_to_buyer","cancel"],
        default: "order_received",
    },
    arrivingBy: {
        type: Date,
        default: null
    },
    acceptedShipingTime: {
        type: Date,
        default: null
    },
    // deliveredDate: {
    //     type: Date,
    //     default: null
    // },
}, { timestamps: true, versionKey: false });

const orderProduct = mongoose.model("orderproducts", orderProductFileds);

export default orderProduct;