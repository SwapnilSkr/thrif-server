import mongoose, { Schema } from "mongoose";

const ticketFields = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId, ref: "users", default: null
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    photos: {
        type: [String]
    },
}, { timestamps: true },
    { versionKey: false });

const ticket = mongoose.model("tickets", ticketFields);

export default ticket;