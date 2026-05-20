import { ChatMistralAI } from '@langchain/mistralai';
import { MistralAIEmbeddings } from "@langchain/mistralai"
import { CONFIG } from '../configs/env.config.js';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { v4 as uuidv4 } from 'uuid';

export const mistralai = new ChatMistralAI({
    model: "mistral-large-latest",
    apiKey: CONFIG.MISTRALAI_API_KEY,
    temperature: 0.7
});

export const embeddings = new MistralAIEmbeddings({
    apiKey: CONFIG.MISTRALAI_API_KEY,
    model: "mistral-embed"
});

const pc = new PineconeClient({
    apiKey: CONFIG.PINECONE_API_KEY,
});

// Lazy initialize index to catch errors better
let pineconeIndex;
const getIndex = () => {
    if (!pineconeIndex) {
        pineconeIndex = pc.Index(CONFIG.PINECONE_INDEX_NAME);
    }
    return pineconeIndex;
};

/**
 * Processes a PDF file and upserts it to Pinecone.
 * @param {string} filePath - Path to the PDF file.
 * @param {string} chatId - The ID of the chat this document belongs to.
 */
export const upsertDocumentToPinecone = async (filePath, chatId) => {
    try {
        console.log(`Loading PDF from: ${filePath}`);
        const loader = new PDFLoader(filePath, {
            splitPages: true,
        });
        const docs = await loader.load();
        
        console.log(`Extracted ${docs.length} pages from PDF`);

        if (docs.length === 0) {
            throw new Error("No text could be extracted from the PDF.");
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = await textSplitter.splitDocuments(docs);
        console.log(`Split into ${splitDocs.length} chunks`);

        if (splitDocs.length === 0) {
            throw new Error("Text splitter produced no chunks.");
        }

        console.log(`Generating embeddings for ${splitDocs.length} chunks...`);
        const texts = splitDocs.map(d => d.pageContent);
        
        let vectors;
        try {
            vectors = await embeddings.embedDocuments(texts);
            console.log(`Generated ${vectors.length} vectors. Each vector dimension: ${vectors[0]?.length}`);
        } catch (embedError) {
            console.error("Error generating embeddings:", embedError);
            throw embedError;
        }

        const index = getIndex();
        console.log(`Preparing records for Pinecone upsertion...`);

        console.log(`Preparing records for Pinecone upsertion...`);

        const records = vectors.map((vector, i) => ({
            id: uuidv4(),
            values: vector,
            metadata: {
                ...splitDocs[i].metadata,
                text: splitDocs[i].pageContent,
                chatId: chatId.toString()
            }
        }));

        console.log(`Upserting ${records.length} records. Array.isArray: ${Array.isArray(records)}`);
        console.log(`First record ID: ${records[0]?.id}`);
        console.log(`First record values length: ${records[0]?.values?.length}`);

        if (!records || records.length === 0) {
            throw new Error("Records array is empty before upsert.");
        }

        try {
            // Direct upsert on index
            console.log("Attempting upsert with records as array...");
            await index.upsert(records);
            console.log(`Successfully upserted ${records.length} documents to Pinecone (direct array)`);
        } catch (directError) {
            console.warn("Direct array upsert failed:", directError.message);
            
            try {
                console.log("Attempting upsert with { vectors: records } format...");
                await index.upsert({ vectors: records });
                console.log(`Successfully upserted ${records.length} documents to Pinecone (vectors object)`);
            } catch (objError) {
                console.warn("Object upsert failed:", objError.message);
                
                try {
                    console.log("Attempting upsert with namespace and direct array...");
                    await index.namespace("documents").upsert(records);
                    console.log(`Successfully upserted ${records.length} documents to Pinecone (namespace array)`);
                } catch (nsError) {
                    console.warn("Namespace array upsert failed:", nsError.message);
                    
                    console.log("Attempting upsert with namespace and { vectors: records }...");
                    await index.namespace("documents").upsert({ vectors: records });
                    console.log(`Successfully upserted ${records.length} documents to Pinecone (namespace vectors object)`);
                }
            }
        }

        return true;
    } catch (error) {
        console.error("Error in upsertDocumentToPinecone final catch:", error);
        throw error;
    }
};

/**
 * Retrieves relevant context from Pinecone for a given query and chatId.
 * @param {string} query - The user query.
 * @param {string} chatId - The ID of the chat.
 * @returns {Promise<string>} - The relevant context.
 */
export const getRelevantContext = async (query, chatId) => {
    try {
        const index = getIndex();
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: "documents",
        });

        console.log(`Searching for context for query: "${query}" in chatId: ${chatId}`);

        // Ensure filter is an object with the correct structure
        const filter = {
            chatId: { $eq: chatId.toString() }
        };

        const results = await vectorStore.similaritySearch(query, 3, filter);

        console.log(`Found ${results.length} relevant results`);

        if (results.length === 0) {
            console.log("No context found in Pinecone for this query.");
            return "";
        }

        return results.map(res => res.pageContent).join("\n\n---\n\n");
    } catch (error) {
        console.error("Error retrieving context from Pinecone:", error);
        return "";
    }
};
