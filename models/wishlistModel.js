import mongoose, { Schema } from "mongoose";

const wishlistFileds = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",

    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        default: null
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
        default: null
    },
    status: {
        type: String,
        enum: ["active", "inactive", "add", "remove"],
        default: "active"
    },
},
    { timestamps: true },
    { versionKey: false }
);

const wishlistModel = mongoose.model("wishlists", wishlistFileds);

export default wishlistModel;