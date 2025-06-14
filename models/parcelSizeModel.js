import mongoose from "mongoose"

const parcelSizeFields = new mongoose.Schema({
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    size: { type: String, default: "" },
    imageURL: { type: String, default: "" },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
}, { timestamps: true },
    { versionKey: false });

const parcelSizes = mongoose.model("parcelsizes", parcelSizeFields);

export default parcelSizes;