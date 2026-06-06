import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chats",
        required: true,
        index: true
    },

    role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true
    },

    content: {
        type: String,
        required: true
    },
    sources: {
        type: Array,
        default: []
    },
    visuals: {
        type: Array,
        default: []
    },
    thoughtTrace: {
        type: String,
        default: ""
    }

}, { timestamps: true });

MessageSchema.index({ chatId: 1, createdAt: -1 });

const MessageModel = mongoose.model("messages", MessageSchema);

export default MessageModel;