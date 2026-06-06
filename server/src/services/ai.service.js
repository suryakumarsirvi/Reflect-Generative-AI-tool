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
            console.error("Error generating embeddings:", embedError.message);
            throw new Error(`Failed to generate embeddings: ${embedError.message}`);
        }

        const index = getIndex();
        console.log(`Preparing ${vectors.length} records for Pinecone...`);

        // Create records with proper structure for Pinecone SDK
        const records = vectors.map((vector, i) => {
            const id = `${chatId}-${uuidv4()}`;
            return {
                id,
                values: vector,
                metadata: {
                    text: splitDocs[i].pageContent,
                    chatId: chatId.toString(),
                    source: splitDocs[i].metadata?.source || 'pdf',
                    page: splitDocs[i].metadata?.loc?.pageNumber || 0
                }
            };
        });

        console.log(`Upserting ${records.length} records to Pinecone index "${CONFIG.PINECONE_INDEX_NAME}"...`);
        console.log(`First record ID: ${records[0]?.id}, Vector dim: ${records[0]?.values?.length}`);

        try {
            // Upsert directly to index without namespace
            const response = await index.upsert(records);
            console.log(`Successfully upserted ${records.length} records to Pinecone`, {
                upsertedCount: records.length,
                response: response
            });
            return true;
        } catch (upsertError) {
            console.error("Direct upsert failed:", upsertError.message);
            
            // Try with namespace as fallback
            try {
                console.log("Attempting upsert with namespace 'documents'...");
                const ns = index.namespace('documents');
                const response = await ns.upsert(records);
                console.log(`Successfully upserted ${records.length} records to Pinecone (with namespace)`, {
                    upsertedCount: records.length,
                    response: response
                });
                return true;
            } catch (nsError) {
                console.error("Namespace upsert also failed:", nsError.message);
                
                // Last resort: try smaller batches
                if (records.length > 1) {
                    console.log(`Attempting batch upsert (${records.length} records in smaller chunks)...`);
                    const batchSize = 10;
                    let successCount = 0;
                    
                    for (let i = 0; i < records.length; i += batchSize) {
                        const batch = records.slice(i, i + batchSize);
                        const batchNum = Math.floor(i / batchSize) + 1;
                        
                        try {
                            console.log(`Upserting batch ${batchNum}/${Math.ceil(records.length / batchSize)} (${batch.length} records)...`);
                            await index.upsert(batch);
                            successCount += batch.length;
                            console.log(`Batch ${batchNum} succeeded`);
                        } catch (batchError) {
                            console.error(`Batch ${batchNum} failed:`, batchError.message);
                            throw batchError;
                        }
                    }
                    
                    console.log(`Successfully upserted all ${successCount} records to Pinecone in batches`);
                    return true;
                }
                
                throw nsError;
            }
        }
    } catch (error) {
        console.error("Error in upsertDocumentToPinecone:", error.message);
        console.error("Stack trace:", error.stack);
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
