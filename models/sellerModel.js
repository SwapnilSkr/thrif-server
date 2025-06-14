import mongoose, { Schema } from "mongoose";

const sellerFields = new mongoose.Schema({
    ownerId: {
        type: Schema.Types.ObjectId, ref: "users", default: null
    },
    billingAddress: {
        type: String
    },
    name: {
        type: String
    },
    bio: {
        type: String
    },
    profilePic: {
        type: String
    },
    panNumber: {
        type: String
    },
    aadharNumber: {
        type: String
    },
    // aadharPhoneNumber: {
    //     type: String
    // },
    // aadharNumberVerificationCode: {
    //     type: Number
    // },
    isAadharNumberVerify: {
        type: Boolean,
        default: false
    },
    gstNumber: {
        type: String
    },
    paymentMethode: {
        type: String,
        enum: ["upi", "card"],
        default: "upi"
    },
    paymentDetails: {
        type: {
            cardName: {
                type: String,
                default:null
            },
            cardNumber: {
                type: String,
                default:null
            },
            cvv: {
                type: String,
                default:null
            },
            ifscCode: {
                type: String,
                default:null
            },
            cardExpired: {
                type: String,
                default:null
            },
            upiId: {
                type: String,
                default:null
            },
        }
    },
    status: {
        type: String,
        enum: ["open", "closed", "temporarilyClosed", "approvalPending", "active", "inactive", "blocked"],
        default: "approvalPending",
    },
    isTrusted: {
        type: Boolean,
        default: false,
    },
    followers: {
        type: [{ type: Schema.Types.ObjectId, ref: "users" }], default: []
    },
    // isApproved: {
    //     type: Boolean,
    //     default: true
    // },
    // products: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Product", default: null
    //     },
    // ],

    // location: {
    //     type: String,
    //     required: true,
    //     trim: true,
    // },
    // followers: {
    //     type: Number,
    //     default: 0,
    // },
    // items_sold: {
    //     type: Number,
    //     default: 0,
    // },
    // ratings: {
    //     type: Number,
    //     default: 0,
    //     min: 0,
    //     max: 5,
    // },
    // reviews: {
    //     type: Number,
    //     default: 0,
    // },
    // reportCount: {
    //     type: Number,
    //     default: 0,
    // },
}, { timestamps: true },
    { versionKey: false });

const seller = mongoose.model("sellers", sellerFields);

export default seller;