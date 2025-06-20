import mongoose, { Schema } from "mongoose";

const phoneSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        country_code: {
            type: String,
            trim: true,
        },
        phone_otp: {
            type: Number,
            default: 0,
        },
        phone_verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
    { versionKey: false }
);

const PhoneVerification = mongoose.model("phoneVerifications", phoneSchema);

export default PhoneVerification; 