import ChatModel from "../models/chat.model.js";
import MessageModel from "../models/message.model.js";
import { generateAIStream, generateChatTitle } from "../services/chat.service.js";
import { upsertDocumentToPinecone } from "../services/ai.service.js";
import { verifyToken } from "../utils/jwt.js";
import * as UserRepository from "../repository/user.repository.js";
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

        const user = await UserRepository.findById(userId);
        if (!user) {
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

            // Truncate messages if editing or regenerating
            const { truncateAfterMessageId } = req.body;
            if (truncateAfterMessageId) {
                const targetMsg = await MessageModel.findOne({ _id: truncateAfterMessageId, chatId: chat._id });
                if (targetMsg) {
                    await MessageModel.deleteMany({
                        chatId: chat._id,
                        createdAt: { $gt: targetMsg.createdAt }
                    });
                }
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

        const { aiResponse, sources, visuals, thoughtTrace } = await generateAIStream({
            userMessage,
            res,
            previousMessages,
            useWebSearch,
            chatId: chat._id,
            user
        });

        await MessageModel.create({
            chatId: chat._id,
            role: "assistant",
            content: aiResponse,
            sources: sources || [],
            visuals: visuals || [],
            thoughtTrace: thoughtTrace || ""
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
    const startTime = Date.now();
    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
        console.log(`[${requestId}] Upload started`);
        
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            console.log(`[${requestId}] Unauthorized: no user ID`);
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        console.log(`[${requestId}] User ID: ${userId}`);

        const { chatId } = req.body;
        const file = req.file;

        // Validate file exists
        if (!file) {
            console.log(`[${requestId}] No file provided`);
            return res.status(400).json({ 
                success: false, 
                message: "No file uploaded",
                error: "File is required"
            });
        }

        console.log(`[${requestId}] File received: ${file.originalname} (${file.size} bytes, type: ${file.mimetype}, path: ${file.path})`);

        // Validate file size (additional check)
        if (file.size > 52428800) {
            await fs.unlink(file.path).catch(() => {});
            console.log(`[${requestId}] File exceeds size limit: ${file.size}`);
            return res.status(400).json({ 
                success: false, 
                message: "File size exceeds 50MB limit",
                error: `File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
            });
        }

        let targetChatId = chatId;

        // If no chatId, create a placeholder chat
        if (!targetChatId) {
            console.log(`[${requestId}] Creating new chat for document: ${file.originalname}`);
            try {
                const chat = await ChatModel.create({
                    userId,
                    title: file.originalname.replace('.pdf', '') || "Document Analysis",
                    lastMessage: "File uploaded: " + file.originalname
                });
                targetChatId = chat._id;
                console.log(`[${requestId}] New chat created: ${targetChatId}`);
            } catch (chatError) {
                console.error(`[${requestId}] Error creating chat:`, chatError);
                await fs.unlink(file.path).catch(() => {});
                return res.status(500).json({
                    success: false,
                    message: "Error creating chat for document",
                    error: chatError.message
                });
            }
        } else {
            // Verify the chat belongs to the user
            console.log(`[${requestId}] Verifying chat: ${chatId}`);
            try {
                const chat = await ChatModel.findOne({ _id: chatId, userId });
                if (!chat) {
                    await fs.unlink(file.path).catch(() => {});
                    console.log(`[${requestId}] Chat not found or unauthorized`);
                    return res.status(403).json({ 
                        success: false, 
                        message: "Chat not found or unauthorized",
                        error: "You don't have access to this chat"
                    });
                }
                console.log(`[${requestId}] Chat verified: ${chatId}`);
            } catch (chatVerifyError) {
                console.error(`[${requestId}] Error verifying chat:`, chatVerifyError);
                await fs.unlink(file.path).catch(() => {});
                return res.status(500).json({
                    success: false,
                    message: "Error verifying chat",
                    error: chatVerifyError.message
                });
            }
        }

        try {
            console.log(`[${requestId}] Starting PDF processing...`);
            const processingStartTime = Date.now();
            await upsertDocumentToPinecone(file.path, targetChatId);
            const processingTime = Date.now() - processingStartTime;
            console.log(`[${requestId}] PDF processing completed in ${processingTime}ms`);
        } catch (processingError) {
            console.error(`[${requestId}] Error processing PDF:`, processingError);
            await fs.unlink(file.path).catch(() => {});
            
            // Provide specific error messages based on the error type
            let errorMessage = "Error processing document";
            let statusCode = 500;
            
            if (processingError.message?.includes("API")) {
                errorMessage = "API configuration error. Please check server configuration.";
                statusCode = 503;
            } else if (processingError.message?.includes("ENOENT") || processingError.message?.includes("cannot find")) {
                errorMessage = "Failed to read PDF file. The file may be corrupted.";
                statusCode = 400;
            } else if (processingError.message?.includes("No text")) {
                errorMessage = "No text could be extracted from the PDF.";
                statusCode = 400;
            } else if (processingError.message?.includes("timeout")) {
                errorMessage = "PDF processing timed out. The file may be too large.";
                statusCode = 408;
            }
            
            console.log(`[${requestId}] Returning error: ${statusCode} - ${errorMessage}`);
            return res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: processingError.message,
                details: process.env.NODE_ENV === 'development' ? processingError.stack : undefined
            });
        }

        // Clean up temporary file
        try {
            await fs.unlink(file.path);
            console.log(`[${requestId}] Temp file cleaned up`);
        } catch (unlinkError) {
            console.warn(`[${requestId}] Warning: Could not clean up temp file:`, unlinkError.message);
        }

        const totalTime = Date.now() - startTime;
        console.log(`[${requestId}] Upload completed successfully in ${totalTime}ms`);

        return res.status(200).json({
            success: true,
            chatId: targetChatId,
            message: "File uploaded and processed successfully",
            fileName: file.originalname,
            fileSize: file.size
        });

    } catch (error) {
        console.error(`[${requestId}] Unexpected error:`, error);
        
        // Clean up file if it exists
        if (req.file) {
            await fs.unlink(req.file.path).catch((e) => {
                console.warn(`[${requestId}] Warning: Could not clean up file:`, e.message);
            });
        }
        
        const totalTime = Date.now() - startTime;
        console.error(`[${requestId}] Upload failed after ${totalTime}ms`);
        
        return res.status(500).json({
            success: false,
            message: "Unexpected error during file upload",
            error: error.message,
            requestId,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { chatId } = req.params;
        const chat = await ChatModel.findOneAndDelete({ _id: chatId, userId });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or unauthorized'
            });
        }

        // Delete all messages in the chat
        await MessageModel.deleteMany({ chatId });

        return res.status(200).json({
            success: true,
            message: 'Chat and associated messages deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to delete chat'
        });
    }
};