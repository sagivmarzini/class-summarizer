import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize API clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Transcription endpoint
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData } = req.body;
    const buffer = Buffer.from(audioData, 'base64');
    const file = new File([buffer], 'audio.wav', { type: 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "he",
      prompt: "This transcript is of a teacher from a class, in Israel, in Hebrew. There will be Hebrew names, verses from bible and Gemarah, etc.",
    });

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Helper function to extract JSON from text
function extractJSON(text) {
  try {
    // Find the first occurrence of '{'
    const start = text.indexOf('{');
    if (start === -1) throw new Error('No JSON object found in response');
    
    // Find the last occurrence of '}'
    const end = text.lastIndexOf('}');
    if (end === -1) throw new Error('No JSON object found in response');
    
    // Extract and parse the JSON
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error extracting JSON:', error);
    throw error;
  }
}

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    console.log('Received text for summarization:', text.substring(0, 100) + '...');
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      messages: [
        { 
          role: "user", 
          content: `
          You are a precise JSON generator and expert note-taker using the Cornell Method. Your task is to create a structured summary of a lecture transcript in Hebrew, formatted as a valid, parseable JSON object.

          OUTPUT CONSTRAINTS:
          1. Return ONLY a single-line JSON object
          2. NO text before or after the JSON object (start with { and end with })
          3. ALL strings must be properly escaped
          4. NO line breaks, tabs, or control characters in strings
          5. ALL HTML tags must be properly closed
          6. Use ONLY double quotes for JSON properties and values

          JSON STRUCTURE:
          {
            "title": "Brief descriptive title",
            "notes": "Main content with HTML formatting",
            "cues": "Key points with HTML formatting",
            "summary": "Concise summary with HTML formatting"
          }

          CONTENT GUIDELINES:
          - Title: Concise, informative (plain text, no HTML)
          - Notes (Main Section):
            * Longest section in the notebook
            * Comprehensive lecture content
            * Use <p>, <ul>, <li>, <strong>, <em> tags
            * Convert bullet points to <ul><li> format
            * Preserve Hebrew text direction
            * Include examples
            * Expand on key points
          - Cues (Side Section):
            * Key terms with definitions
            * Study questions
            * Important concepts
            * Use HTML lists for organization
          - Summary (Bottom Section):
            * Concise overview
            * Key takeaways
            * Single paragraph with <p> tags

          HEBREW LANGUAGE RULES:
          - All content must be in Hebrew
          - Correct any obvious transcription errors in quotes/verses
          - Maintain proper Hebrew text direction
          - Use correct Hebrew punctuation

          HTML FORMATTING:
          - Valid tags: <p>, <ul>, <li>, <ol>, <strong>, <em>, <br>
          - All tags must be properly closed
          - No attributes in HTML tags
          - No nested lists
          - No custom CSS or classes

          Example structure (but in Hebrew):
          {"title": "Topic Name", "notes": "<p>Main point</p><ul><li>Detail 1</li></ul>", "cues": "<ul><li>Key term: definition</li></ul>", "summary": "<p>Overview</p>"}

          Process the following transcript according to these specifications, ensuring the output is a valid, parseable JSON string:

          ${text}`
        },
      ],
    });

    const result = response.content[0].text;
    console.log('API Response received:', result.substring(0, 100) + '...');
    
    // Extract and parse JSON from the response
    const jsonData = extractJSON(result);
    res.json(jsonData);
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ 
      error: 'Failed to summarize text',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
