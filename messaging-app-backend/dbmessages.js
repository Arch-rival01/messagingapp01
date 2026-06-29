import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: false,
  },
  mediaUrl: {
    type: String,
    required: false,
  },
  mediaType: {
    type: String, // 'image' or 'video'
    required: false,
  },
  sender: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
