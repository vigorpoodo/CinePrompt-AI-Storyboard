import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Configure CORS for your frontend domain
const allowedOrigins = [
    'https://cine-prompt-ai-storyboard.vercel.app',
    'http://localhost:5173', // Vite dev server
    'http://localhost:4173', // Vite preview
  ];

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
  ) {
    // Handle CORS preflight
  const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
        return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
        return res.status(405).json({ 
                                          error: 'Method not allowed',
                message: 'Only POST requests are accepted' 
        });
  }

  try {
        // Validate API key is configured
      if (!process.env.GEMINI_API_KEY) {
              console.error('GEMINI_API_KEY environment variable is not set');
              return res.status(500).json({ 
                                                  error: 'Configuration error',
                        message: 'API key not configured on server' 
              });
      }

      // Extract and validate request body
      const { prompt, modelName = 'gemini-pro' } = req.body;

      if (!prompt || typeof prompt !== 'string') {
              return res.status(400).json({ 
                                                  error: 'Invalid request',
                        message: 'Prompt is required and must be a string' 
              });
      }

      if (prompt.length > 10000) {
              return res.status(400).json({ 
                                                  error: 'Invalid request',
                        message: 'Prompt exceeds maximum length of 10000 characters' 
              });
      }

      // Initialize the model
      const model = genAI.getGenerativeModel({ model: modelName });

      // Generate content with timeout
      const timeoutPromise = new Promise((_, reject) => 
                                               setTimeout(() => reject(new Error('Request timeout')), 30000)
                                             );

      const generatePromise = model.generateContent(prompt);

      const result = await Promise.race([generatePromise, timeoutPromise]) as any;

      // Extract the response text
      const response = await result.response;
        const text = response.text();

      // Return successful response
      return res.status(200).json({ 
                                        success: true,
              text,
              model: modelName,
              timestamp: new Date().toISOString()
      });

  } catch (error: any) {
        // Log error for debugging (visible in Vercel logs)
      console.error('Gemini API Error:', {
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
      });

      // Handle specific error types
      if (error.message?.includes('timeout')) {
              return res.status(504).json({ 
                                                  error: 'Gateway timeout',
                        message: 'Request to AI service timed out' 
              });
      }

      if (error.message?.includes('API key')) {
              return res.status(401).json({ 
                                                  error: 'Authentication error',
                        message: 'Invalid API key configuration' 
              });
      }

      if (error.message?.includes('quota')) {
              return res.status(429).json({ 
                                                  error: 'Rate limit exceeded',
                        message: 'API quota exceeded, please try again later' 
              });
      }

      // Generic error response
      return res.status(500).json({ 
                                        error: 'Internal server error',
              message: 'Failed to generate content',
              details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
}
