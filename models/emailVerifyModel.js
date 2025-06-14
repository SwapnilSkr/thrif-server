import mongoose, { Schema } from "mongoose";

const emailSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
        },
        email_otp: {
            type: Number,
            default: 0,
        },
        email_verified: {
            type: Boolean,
            default: false,
        },

    },
    { timestamps: true },
    { versionKey: false }
);

const EmailVerification = mongoose.model("emailVerifications", emailSchema);

export default EmailVerification;
