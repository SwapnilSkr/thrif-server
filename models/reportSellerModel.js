import mongoose, { Schema } from "mongoose";

const reportFields = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId, ref: "users", default: null
    },
    sellerId: {
        type: Schema.Types.ObjectId, ref: "sellers", default: null
    },
    text: {
        type: String
    },
    status: {
        type: String
    },
}, { timestamps: true },
    { versionKey: false });

const report = mongoose.model("reports", reportFields);

export default report;