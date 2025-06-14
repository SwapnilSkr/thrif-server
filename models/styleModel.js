import mongoose, { Schema } from "mongoose";

const styleFileds = new mongoose.Schema({
    title: { type: String, },
    imageURL: { type: String },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    remark: { type: String },
    catId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
},
    { timestamps: true },
    { versionKey: false }
);

const styleModel = mongoose.model("styles", styleFileds);

export default styleModel;