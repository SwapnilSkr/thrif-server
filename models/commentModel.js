import mongoose from "mongoose";



const commentFields = new mongoose.Schema({
    comment: {
        type: String,
        default: ""
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: "users",
        default: null
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId, ref: "posts",
        default: null
    },
    reply: {
        type: Object,
        default: null
        // {sellerId:"",reply:""}
    }
}, { timestamps: true }, { versionKey: false });

const comments = mongoose.model("comments", commentFields);

export default comments