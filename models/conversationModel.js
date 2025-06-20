import mongoose from "mongoose";
const { Schema } = mongoose;

const conversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "users" }],
}, { timestamps: true });

const Conversation = mongoose.model("conversations", conversationSchema);
export default Conversation; 