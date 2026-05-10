import 'dotenv/config';

const requiredEnv = [
    'MONGO_URI',
    'SERVER_HOST',
    'SERVER_PORT',
    'JWT_SECRET'
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

export const CONFIG = Object.freeze({
    SERVER_PORT: process.env.SERVER_PORT,
    SERVER_HOST: process.env.SERVER_HOST,
    JWT_SECRET: process.env.JWT_SECRET,
    MONGO_URI: process.env.MONGO_URI,
    GOOGLE_OAUTH_CLIENTID: process.env.GOOGLE_OAUTH_CLIENTID,
    GOOGLE_OAUTH_SECRETKEY: process.env.GOOGLE_OAUTH_SECRETKEY,
    GOOGLE_OAUTH_CALLBACK: process.env.GOOGLE_OAUTH_CALLBACK,
    MISTRALAI_API_KEY: process.env.MISTRALAI_API_KEY,
    CLIENT_URL: process.env.CLIENT_URL,
    NODE_ENV: process.env.NODE_ENV,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY
});


// tool: Tavily helps to access internet in AI;
// chat creates, messages save, streaming, ai should have internet access, prompt kit ui, or any other ui library