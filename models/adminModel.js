import mongoose from "mongoose";

const adminFileds = new mongoose.Schema({
    name: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    email_otp: {
        type: Number,
        default: 0,
    },
    email_otp_verified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    password: {
        type: String,
        default: ""
    },
    imageURL: {
        type: String,
        default: ""
    },
}, {
    timestamps: true,
}, { versionKey: true });

const admin = mongoose.model("admins", adminFileds);

export default admin