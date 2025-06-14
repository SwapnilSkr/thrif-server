import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema({
  actionId: { type: String},
  userId: { type: Schema.Types.ObjectId, ref: "users", default:null },
  fromUserId: { type: String },
  payload: { type: Object },
  type: { type: String, },//enum: ["user", "product","post","offer"],
  otherActionId: {type:String,},
  notificationType: { type: String, },//enum:["follow","friendRequestSend","friendRequestAccepted","like","comment","verificationRequest","blockBlippers","blockBlip","inactiveBlippers","inactiveBlip","changePassword"] },
  isRead: { type: Boolean, default: false },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
});

const notification = mongoose.model("notifications", notificationSchema);

export default notification;
