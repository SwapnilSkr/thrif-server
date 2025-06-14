import mongoose from "mongoose";

const postFileds = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sellers",
    },
    productIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "products",
    },
    description: {
        type: String
    },
    images: {
        type: [String],
    },
    video: {
        type: [String],
        default:[]
    },
    status: {
        type: String,
        enum: ["available", "sold", "outOfStock", "upcomming", "active", "inactive", "deleted","approvalPending","notApproved","approved",],
        default: "active",
    },
}, { timestamps: true, versionKey: false });

const Post = mongoose.model("posts", postFileds);

export default Post;