import mongoose from "mongoose"

const hashtagFields = new mongoose.Schema({
    title: { type: String, default: "" },
    imageURL: { type: String, default: "" },
    remark: { type: String, default: "" },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
}, { timestamps: true },
    { versionKey: false });

const hashtags = mongoose.model("hashtags", hashtagFields);

export default hashtags;