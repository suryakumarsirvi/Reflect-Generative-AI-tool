import { mistralai } from "./ai.service.js";
import { tavily } from "@tavily/core";
import { CONFIG } from "../configs/env.config.js";

const SYSTEM_PROMPT = `You are a helpful, precise, and highly intelligent assistant (similar to Perplexity AI).
Answer the user's question clearly and accurately. If provided with web search context, base your answer heavily on that context and synthesize the information. Format your answers beautifully using Markdown. Do not hallucinate information.`;

const normalizeChunkText = (chunk) => {
    if (!chunk) return "";
    if (typeof chunk === 'string') return chunk;

    const candidates = [];

    if (Array.isArray(chunk)) {
        candidates.push(...chunk);
    } else {
        candidates.push(chunk);
    }

    for (const item of candidates) {
        if (!item) continue;
        const text = item?.content || item?.text || item?.message?.content || item?.contentBlocks?.[0]?.text || item?.message?.text;
        if (typeof text === 'string' && text.length > 0) {
            return text;
        }
    }

    return "";
};

export const generateAIStream = async ({ userMessage, res, previousMessages = [], useWebSearch = false }) => {
    
    let searchContext = "";
    
    if (useWebSearch && CONFIG.TAVILY_API_KEY) {
        try {
            // Optional: send a status update to frontend that we are searching
            res.write(`data: ${JSON.stringify({ type: 'message', text: '*Searching the web...*\n\n' })}\n\n`);
            res.flush?.();

            const tvly = tavily({ apiKey: CONFIG.TAVILY_API_KEY });
            const searchResponse = await tvly.search(userMessage, { 
                searchDepth: "basic",
                includeImages: false
            });
            
            if (searchResponse && searchResponse.results && searchResponse.results.length > 0) {
                searchContext = "Here is the real-time context from the web to help you answer accurately:\n\n" + 
                    searchResponse.results.map(r => `Source: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}`).join("\n\n---\n\n");
            }
        } catch (error) {
            console.error("Tavily search failed:", error);
        }
    }

    const finalSystemPrompt = searchContext ? `${SYSTEM_PROMPT}\n\n${searchContext}` : SYSTEM_PROMPT;

    const stream = await mistralai.stream([
        { role: "system", content: finalSystemPrompt },
        ...previousMessages,
        { role: "user", content: userMessage }
    ]);

    if (!stream) {
        throw new Error("Error generating AI stream");
    }

    let AIResponse = "";

    for await (let chunk of stream) {
        const text = normalizeChunkText(chunk);

        if (!text) continue;

        AIResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'message', text })}\n\n`);
        res.flush?.();
    }

    res.end();

    return AIResponse;
};

export const generateChatTitle = async (userMessage) => {
    try {
        const response = await mistralai.invoke([
            {
                role: "system",
                content: "Generate a short and descriptive title for a chat based on the following message. Max 3 words."
            },
            {
                role: "user",
                content: userMessage
            }
        ]);

        let title = response?.content || "New Chat";
        title = title.replace(/[*"]/g, "").trim();

        return title || "New Chat";

    } catch (error) {
        console.error("Error generating chat title:", error);
        return "New Chat";
    }
};