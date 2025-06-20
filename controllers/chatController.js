import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'id name avatar')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'id name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send a message in a conversation
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type, productData } = req.body;
    const sender = req.user._id;
    const message = new Message({
      conversation: conversationId,
      sender,
      content,
      type: type || 'text',
      productData: productData || undefined
    });
    await message.save();
    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new conversation (if not exists)
export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 }
    });
    if (!conversation) {
      conversation = new Conversation({ participants: [userId, participantId] });
      await conversation.save();
    }
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 