
import mongoose from "mongoose";

const addressFileds = new mongoose.Schema({
    latitude: {
        type: String,
        default: ""
    },
    longititude: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: "dehli"
    },
    type: {
        type: String,
        default: ""
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: "users", default: null
    },
    pinCode: {
        type: String,
        default: ""
    },
    landmark: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    houseNumber: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
}, {
    timestamps: true,
}, { versionKey: true });

const address = mongoose.model("addresses", addressFileds);

export default address