import mongoose, { Schema } from "mongoose";

const tokenSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    deviceToken: {
        type: String,
        default: null,
    },
    deviceType: {
        type: String,
        default: null,
    },
    deviceId: {
        type: String,
        default: null,
    },
    status: { type: Boolean, default: true },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    updatedDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true },
    { versionKey: false });


const UserToken = mongoose.model("userstoken", tokenSchema);

export default UserToken;
