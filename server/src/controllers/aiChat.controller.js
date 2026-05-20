import ChatModel from "../models/chat.model.js";
import MessageModel from "../models/message.model.js";
import { generateAIStream, generateChatTitle } from "../services/chat.service.js";
import { upsertDocumentToPinecone } from "../services/ai.service.js";
import { verifyToken } from "../utils/jwt.js";
import fs from "fs/promises";

const getUserIdFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else {
        token = req.cookies?.refreshToken;
    }

    if (!token) return null;

    try {
        const decoded = verifyToken(token);
        return decoded?.id;
    } catch (error) {
        return null;
    }
};

export const getChats = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const chats = await ChatModel.find({ userId }).sort({ updatedAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            data: chats
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to fetch chats'
        });
    }
};

export const getChatMessages = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { chatId } = req.params;
        const chat = await ChatModel.findOne({ _id: chatId, userId });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const messages = await MessageModel.find({ chatId: chat._id }).sort({ createdAt: 1 }).lean();

        return res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to fetch chat messages'
        });
    }
};

export const AIresponse = async (req, res) => {
    try {
        const { message: userMessage, chatId, useWebSearch } = req.body;
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!userMessage?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your message"
            });
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        let chat;

        if (!chatId) {
            const title = await generateChatTitle(userMessage);

            chat = await ChatModel.create({
                userId,
                title,
                lastMessage: userMessage
            });

        } else {
            chat = await ChatModel.findOne({ _id: chatId, userId });

            if (!chat) {
                throw new Error("Chat not found");
            }
        }

        const previousMessages = await MessageModel
            .find({ chatId: chat._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        previousMessages.reverse();

        await MessageModel.create({
            chatId: chat._id,
            role: "user",
            content: userMessage
        });

        res.write(`data: ${JSON.stringify({ type: 'meta', chat: { _id: chat._id, title: chat.title, lastMessage: chat.lastMessage } })}\n\n`);

        const aiResponse = await generateAIStream({
            userMessage,
            res,
            previousMessages,
            useWebSearch,
            chatId: chat._id
        });

        await MessageModel.create({
            chatId: chat._id,
            role: "assistant",
            content: aiResponse
        });

        await ChatModel.findByIdAndUpdate(chat._id, {
            lastMessage: userMessage
        });

        return;

    } catch (error) {
        console.error("Error in AIresponse controller:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};

export const uploadDocument = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { chatId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        let targetChatId = chatId;

        // If no chatId, create a placeholder chat or just use a temporary one
        // For simplicity, we assume the frontend might send an existing chatId or we create one
        if (!targetChatId) {
            const chat = await ChatModel.create({
                userId,
                title: "Document Analysis",
                lastMessage: "File uploaded: " + file.originalname
            });
            targetChatId = chat._id;
        }

        await upsertDocumentToPinecone(file.path, targetChatId);

        // Clean up temporary file
        await fs.unlink(file.path);

        return res.status(200).json({
            success: true,
            chatId: targetChatId,
            message: "File uploaded and processed successfully"
        });

    } catch (error) {
        console.error("Error in uploadDocument controller:", error);
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        return res.status(500).json({
            success: false,
            message: "Error processing document"
        });
    }
};