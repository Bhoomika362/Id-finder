import OpenAI from "openai";

// Ensure the API key is present at module load to fail fast in development
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set. Add it to your .env file.");
}

export const openai = new OpenAI({ apiKey });

export default openai;



