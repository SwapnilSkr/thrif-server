import mongoose, { Schema } from "mongoose";

const paymentMethodeFields = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users", default: null },
    methodeType: { type: String, enum: ["card", "upi", "cash"], default: "card" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    // cardHolderName: { type: String },
    paymentType: { type: String },//gpay visa 
    issuer: { type: String },//HDFC
    type: { type: String },//credit
    // expiredAt: { type: String },//MM/YY
    paymentId: { type: String },
    isDefault: { type: Boolean, default: false },
    razorpayTokenizedID: { type: String,default:null },
}, { timestamps: true }, { versionKey: false });

const paymentMethodes = mongoose.model("paymentmethods", paymentMethodeFields);

export default paymentMethodes;