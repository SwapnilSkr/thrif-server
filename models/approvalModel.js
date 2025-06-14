import mongoose from "mongoose";

const approvalFields = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
        default:null
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        default:null
    },
    reasone: {
        type: String
    },
    status: {
        type: String,
        enum: ["notApproved", "approved"],
        default: "approved"
    }
}, {
    timestamps: true
}, {
    versionKey: false
});

const approval = mongoose.model("approvals", approvalFields);
export default approval