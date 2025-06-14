import mongoose from "mongoose";

const bannnerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            unique: true,
        },
        imageURL: {
            type: String,
            default: ""
        },
        buttonName: {
            type: String,
            default: ""
        },
        buttonRedirectionURL: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        productIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "products",
        },
        type: {
            type: String,
            enum: ["banner", "featured"],
            default: "banner"
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
    },
    { timestamps: true },
    { versionKey: false }
);

const Banner = mongoose.model("banners", bannnerSchema);

export default Banner;
