import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      // unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    username: {
      type: String,
      // minlength: [3, "Username must be at least 6 characters long."],
      // unique: true,
      // trim: true,
    },
    profilePic: {
      type: String,
      trim: true,
    },
    socialAuthUID: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (v) {
          return v < Date.now();
        },
      },
    },
    country_code: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    password: {
      type: String
    },
    displayType: {
      type: String,
      enum: ["notToSay", "she/her", "he/him", "they/them", "other/specify"],
      default: "notToSay"
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked", "delete"],
      default: "active"
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    phone_verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "female",
    },
    isNotificationAllow: {
      type: Boolean,
      default: false
    },
    interest: {
      type: [String],
      default: [],
    },
    brandIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "brands" }],
      default: [],
    },
    recentViewProductIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "products" }],
      default: [],
    },
    sizes: {
      type: [{ type: String }],
      default: [],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    onboarding: {
      type: Boolean,
      default: false,
    },
    blockedSellers: {
      type: [{ type: Schema.Types.ObjectId, ref: "sellers" }],
      default: [],
    },

    followingSellers: {
      type: [{ type: Schema.Types.ObjectId, ref: "sellers" }], // jinko me follow krti hu
      default: []
    },
    onlyFollowUserSendMessage: {
      type: Boolean,
      default: false,
    },
    isAdvertisementAllow: {
      type: Boolean,
      default: false,
    },
    razorpayCustomerId: {
      type: String,
      default: null
    },
    razorpayCustomer: {
      type: Object,
      default: null
    },
    lastUsernameChangeDate: {
      type: Date,
      default: null
    },
    isSiteCustomizationAllow: {
      type: Boolean,
      default: false,
    },
    isSiteCustomizationAllow: {
      type: Boolean,
      default: false,
    },
    paymentAndPurchaseNotification: {
      type: Object,
      default: {
        "email": true,
        "textMessage": true,
        "pushNotification": true
      }
    },
    dealOfferAndSurprisesNotification: {
      type: Object,
      default: {
        "email": true,
        "textMessage": true,
        "pushNotification": true
      }
    },
    isVerify: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true },
  { versionKey: false }
);

const User = mongoose.model("users", userSchema);

export default User;
