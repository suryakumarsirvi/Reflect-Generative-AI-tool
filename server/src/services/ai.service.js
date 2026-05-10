import { ChatMistralAI } from '@langchain/mistralai';
import { CONFIG } from '../configs/env.config.js';

export const mistralai = new ChatMistralAI({
    model: "mistral-large-latest",
    apiKey: CONFIG.MISTRALAI_API_KEY,
    temperature: 0.7
});