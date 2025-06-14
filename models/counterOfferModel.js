import mongoose, { Schema } from "mongoose";

const counterOfferFileds = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "users", default: null },
    sellerId: { type: Schema.Types.ObjectId, ref: "sellers", default: null },
    productId: { type: Schema.Types.ObjectId, ref: "products", default: null },
    productVarientId: { type: Schema.Types.ObjectId, ref: "productvarients", default: null },
    productVarientItemId: { type: Schema.Types.ObjectId, ref: "productvarientitems", default: null },
    offerPercentage: { type: Number },
    afterDiscountAmt: { type: Number },
    beforeDiscount: { type: Number },
    expiredDate: { type: Date, default: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) },
    status: { type: String, enum: ["counterBySeller", "counterByBuyer", "declineByBuyer", "declineBySeller", "acceptBySeller", "acceptByBuyer", "purchaseInitiated", "cancelledBySeller", "cancelledByBuyer", "pickupInitiated"], default: "counterByBuyer" }
}, {
    timestamps: true,
}, { versionKey: false });

const counterOffer = mongoose.model("counteroffers", counterOfferFileds);

export default counterOffer;

/*

buyer make offer *counterByBuyer*
buyer --> Withdraw
seller --> Accept/Decline/Counter

seller decline offer *declineBySeller*
buyer --> Make new offer
seller -->  Resend offer

seller Accept offer *acceptBySeller*
buyer --> Withdraw Offer/Buy Now
seller -->  "Withdraw Offer" (if payment not yet initiated).

seller Counter *counterBySeller*
buyer --> Accept/Decline/Counter
seller -->  awaiting buyer action


*/


/*
For frantend
if login user id === userId its buyer
Buyer Side
    "status": "counterByBuyer",
    buyer --> Withdraw
    otherStatus:"active"

Seller Side
    "status": "counterByBuyer",
    seller --> Accept/Decline/Counter
    otherStatus:"active"


Buyer Side  
    "status": "declineBySeller",
    buyer --> Make New Offer
    otherStatus:"decline"   

Seller Side  
    "status": "declineBySeller",
    seller --> Resend Offer
    otherStatus:"decline"


Buyer Side  
    "status": "counterBySeller",
    buyer --> Accept/Decline/Counter
    otherStatus:"active"   

Seller Side  
    "status": "counterBySeller",
    seller --> Withdraw
    otherStatus:"active"

Buyer Side  
    "status": "acceptBySeller",
    buyer -->  "Buy Now" and "Withdraw Offer"
    otherStatus:"Accepted"   

Seller Side  
    "status": "acceptBySeller",
    seller --> Withdraw
    otherStatus:"Accepted"
*/