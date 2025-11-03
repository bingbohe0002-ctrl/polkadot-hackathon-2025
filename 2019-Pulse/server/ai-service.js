/**
 * AI Service using free Groq API (Llama models)
 * Provides smart reply, content polish, and chat summary features
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Groq API configuration (FREE)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant'; // Fast and free Groq model

/**
 * Call Groq API
 */
async function callGroqAPI(messages, temperature = 0.7) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    throw new Error('AI service temporarily unavailable');
  }
}

/**
 * Alternative: Use Hugging Face Inference API (also FREE)
 */
async function callHuggingFaceAPI(prompt) {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
  const HF_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data[0].generated_text;
  } catch (error) {
    console.error('Hugging Face API Error:', error.response?.data || error.message);
    throw new Error('AI service temporarily unavailable');
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Service is running' });
});

/**
 * Generate smart reply
 * POST /api/ai/smart-reply
 * Body: { userInput: string, context?: string }
 */
app.post('/api/ai/smart-reply', async (req, res) => {
  try {
    const { userInput, context } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: 'User input is required' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful chat assistant. Generate a smart, friendly, and contextually appropriate reply based on the user\'s input. Keep responses concise (1-2 sentences) and natural.',
      },
      {
        role: 'user',
        content: context 
          ? `Context: ${context}\n\nUser wants to reply to this. Generate a smart reply based on their input: "${userInput}"`
          : `Generate a smart reply for: "${userInput}"`,
      },
    ];

    const reply = await callGroqAPI(messages, 0.8);

    res.json({ 
      success: true, 
      reply: reply.trim(),
      model: MODEL 
    });
  } catch (error) {
    console.error('Smart reply error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Polish content
 * POST /api/ai/polish
 * Body: { content: string }
 */
app.post('/api/ai/polish', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a writing assistant. Improve the user\'s message to make it clearer, more polished, and professional while maintaining their original intent and tone. Keep it concise.',
      },
      {
        role: 'user',
        content: `Polish this message: "${content}"`,
      },
    ];

    const polished = await callGroqAPI(messages, 0.5);

    res.json({ 
      success: true, 
      polished: polished.trim(),
      original: content,
      model: MODEL 
    });
  } catch (error) {
    console.error('Polish error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Generate chat summary
 * POST /api/ai/summarize
 * Body: { messages: Array<{sender, content, timestamp}>, date?: string }
 */
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { messages, date } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Format messages for AI
    const formattedMessages = messages
      .slice(-50) // Limit to last 50 messages to avoid token limits
      .map(msg => `${msg.sender || 'User'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = [
      {
        role: 'system',
        content: 'You are a chat summarizer. Create a concise summary of the chat conversation highlighting key topics, decisions, and important points. Use bullet points for clarity.',
      },
      {
        role: 'user',
        content: `Summarize this chat conversation${date ? ` from ${date}` : ''}:\n\n${formattedMessages}`,
      },
    ];

    const summary = await callGroqAPI(systemPrompt, 0.3);

    res.json({ 
      success: true, 
      summary: summary.trim(),
      messageCount: messages.length,
      date: date || new Date().toLocaleDateString(),
      model: MODEL 
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Generate translation
 * POST /api/ai/translate
 * Body: { text: string, targetLanguage: string }
 */
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a translator. Translate the following text to ${targetLanguage}. Only provide the translation, no explanations.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const translation = await callGroqAPI(messages, 0.3);

    res.json({ 
      success: true, 
      translation: translation.trim(),
      original: text,
      targetLanguage,
      model: MODEL 
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on http://localhost:${PORT}`);
  console.log(`Using model: ${MODEL}`);
  console.log(`✅ Groq API Key configured (built-in)`);
  console.log(`🚀 Ready to handle AI requests!`);
});

export default app;

