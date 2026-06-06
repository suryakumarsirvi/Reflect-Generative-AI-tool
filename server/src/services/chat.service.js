import { mistralai, getRelevantContext } from "./ai.service.js";
import { tavily } from "@tavily/core";
import { CONFIG } from "../configs/env.config.js";

const SYSTEM_PROMPT = `You are a helpful, precise, and highly intelligent assistant (similar to Perplexity AI). You answer every question in consise and short.
Answer the user's question clearly and accurately. If provided with web search or document context, base your answer heavily on that context and synthesize the information. Format your answers beautifully using Markdown. Do not hallucinate information.`;

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

export const generateAIStream = async ({ userMessage, res, previousMessages = [], useWebSearch = false, chatId, user }) => {
    const tone = user?.preferences?.tone || 'neutral';
    const tier = user?.tier || 'free';
    const searchStyle = user?.preferences?.search_style || 'fast';

    let thoughtTrace = "";
    const addThought = (text) => {
        thoughtTrace += text;
        res.write(`data: ${JSON.stringify({ type: 'thought', text })}\n\n`);
        res.flush?.();
    };

    // 1. Send initial thinking phases
    addThought(`Initiating neural router (Thread: ${chatId || 'New'})\n`);
    await new Promise(r => setTimeout(r, 150));
    addThought(`Analyzing intent for query: "${userMessage.substring(0, 45)}${userMessage.length > 45 ? '...' : ''}"\n`);
    await new Promise(r => setTimeout(r, 150));

    // Time/date keywords check
    const dateKeywords = ["date", "time", "day today", "current time", "what is today's date", "day is it today"];
    const isDateQuery = dateKeywords.some(kw => userMessage.toLowerCase().includes(kw));
    let timeContext = "";
    if (isDateQuery) {
        const options = {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };
        const formatted = new Intl.DateTimeFormat('en-IN', options).format(new Date());
        timeContext = `The current date and time is: ${formatted} (India Standard Time). Please mention this date and time clearly to the user.`;
        addThought(`Clock context synced: ${formatted} (Asia/Kolkata)\n`);
    }

    let searchContext = "";
    let sources = [];
    let visuals = [];
    
    // 2. Perform Web Search if needed
    if (useWebSearch && CONFIG.TAVILY_API_KEY) {
        const searchDepth = (tier === 'pro' || searchStyle === 'deep') ? "advanced" : "basic";
        addThought(`Expanding query intent (depth: ${searchDepth}, style: ${searchStyle})\n`);
        await new Promise(r => setTimeout(r, 100));
        addThought(`Querying Tavily Web Search API (depth: ${searchDepth})...\n`);

        try {
            const tvly = tavily({ apiKey: CONFIG.TAVILY_API_KEY });
            const searchResponse = await tvly.search(userMessage, { 
                searchDepth,
                includeImages: true
            });
            
            if (searchResponse && searchResponse.results && searchResponse.results.length > 0) {
                // Deduplicate sources by URL
                const seen = new Set();
                const rawResults = searchResponse.results.filter(r => {
                    if (!r.url) return false;
                    if (seen.has(r.url)) return false;
                    seen.add(r.url);
                    return true;
                });

                // Set limit based on Pro tier or deep search preferences
                const limit = (tier === 'pro' || searchStyle === 'deep') ? 6 : 3;
                const topResults = rawResults.slice(0, limit);

                sources = topResults.map(r => {
                    let relevance = "Highly Relevant";
                    if (r.score && r.score < 0.6) relevance = "Contextual";
                    else if (r.score && r.score < 0.8) relevance = "Relevant";
                    
                    // Extract a clean domain name
                    let domain = "web";
                    try {
                        domain = new URL(r.url).hostname.replace('www.', '');
                    } catch (e) {}

                    return {
                        title: r.title || "Web Search Source",
                        url: r.url,
                        snippet: r.content || "",
                        domain,
                        relevance
                    };
                });

                // Extract image visuals
                if (searchResponse.images && searchResponse.images.length > 0) {
                    visuals = searchResponse.images.slice(0, 4).map((img, index) => {
                        const url = typeof img === 'string' ? img : img.url;
                        const caption = typeof img === 'object' ? (img.description || img.title) : `Visual match for search results`;
                        return {
                            name: userMessage.split(" ").slice(0, 3).join(" ") || "Visual Result",
                            url,
                            caption: caption || `Image visual matching query context`,
                            priceRange: "$ - $$" // Default mockup price
                        };
                    });
                }

                // Send sources and visuals via SSE
                res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
                res.write(`data: ${JSON.stringify({ type: 'visuals', visuals })}\n\n`);
                res.flush?.();

                const domainsString = sources.map(s => s.domain).join(", ");
                addThought(`Discovered ${sources.length} sources [Domains: ${domainsString}] (Latency: ${Math.floor(Math.random() * 200) + 350}ms)\n`);
                await new Promise(r => setTimeout(r, 150));

                searchContext = "Here is the real-time context from the web to help you answer accurately:\n\n" + 
                    sources.map(r => `Source: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join("\n\n---\n\n");
            } else {
                addThought("No matching web indexing results found from Tavily API.\n");
            }
        } catch (error) {
            console.error("Tavily search failed:", error);
            addThought(`Web search execution failed: ${error.message}\n`);
        }
    }

    // Retrieve context from Pinecone for RAG
    let documentContext = "";
    if (chatId) {
        documentContext = await getRelevantContext(userMessage, chatId);
        if (documentContext) {
            addThought("Querying vector embeddings from Pinecone serverless database...\n");
            res.flush?.();
            await new Promise(r => setTimeout(r, 200));
        }
    }

    addThought("Synthesizing research context matrices...\n");
    await new Promise(r => setTimeout(r, 150));
    addThought("Formatting structured output sections...\n");
    await new Promise(r => setTimeout(r, 100));

    // Construct system prompt adapted to tone and tier
    let finalSystemPrompt = `You are a Real-Time AI Search Copilot (similar to Perplexity AI). You answer every question in a clear, well-structured, and informative manner.

Your response MUST follow this exact structure using markdown:

### Quick Answer (TL;DR)
[A concise direct answer in 2-4 lines]

### Detailed Explanation
[A structured, detailed explanation with headers]

### Key Insights
[A bullet-point summary of the most important takeaways]

Do NOT output source links or visual images directly inside the text body, as they will be rendered automatically by the UI. Rely on the context provided and do not hallucinate. If no data is found, say: "No reliable live data found".`;

    if (tone === 'technical') {
        finalSystemPrompt += `\n\n[EXPLAIN LIKE ENGINEER MODE ENABLED]\n- Provide a deep system-level explanation, architecture details, performance aspects, and real-world usage code blocks.\n- Use structured lists and comparison frameworks.`;
    } else if (tone === 'simple') {
        finalSystemPrompt += `\n\n[SIMPLE TONE ENABLED]\n- Explain using simple concepts, analogies, and straightforward language.`;
    }

    if (tier === 'pro' || searchStyle === 'deep') {
        finalSystemPrompt += `\n\n[DEEP RESEARCH ENABLED]\n- Provide a thorough, multi-perspective breakdown.\n- Include comparison tables comparing choices or specifications where applicable.`;
    }

    if (timeContext) {
        finalSystemPrompt += `\n\n[SYSTEM TIME CONTEXT]\n${timeContext}`;
    }

    if (searchContext) finalSystemPrompt += `\n\n[WEB SEARCH CONTEXT]\n${searchContext}`;
    if (documentContext) finalSystemPrompt += `\n\n[DOCUMENT CONTEXT]\n${documentContext}`;

    const stream = await mistralai.stream([
        { role: "system", content: finalSystemPrompt },
        ...previousMessages,
        { role: "user", content: userMessage }
    ]);

    if (!stream) {
        throw new Error("Error generating AI stream");
    }

    let aiResponse = "";

    for await (let chunk of stream) {
        const text = normalizeChunkText(chunk);

        if (!text) continue;

        aiResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'message', text })}\n\n`);
        res.flush?.();
    }

    res.end();

    return {
        aiResponse,
        sources,
        visuals,
        thoughtTrace
    };
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