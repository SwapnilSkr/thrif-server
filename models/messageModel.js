import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: "conversations", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "users", required: true },
  content: { type: String, required: false },
  type: { type: String, default: "text" },
  productData: { type: Object, required: false },
}, { timestamps: true });

const Message = mongoose.model("messages", messageSchema);
export default Message; 