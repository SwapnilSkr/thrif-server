import mongoose from "mongoose";

const likeSchema  = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
        required: true,
    }
},{timestamps: true, versionKey: false});

const Like = mongoose.model("postlikes", likeSchema);

export default Like;