import { Generic } from './generic.js'

const MAX_PROMPT_LEN = 10000
const MAX_TOKENS = 1024

export class Gemini extends Generic {
  constructor (system, {
    model,
    host,
    endpoint,
    apiKey,
    temperature,
    maxTokens
  }) {
    super(system, { model, host, endpoint, apiKey, temperature, maxTokens })
    // Gemini API key is typically a query parameter, not a header.
    // We'll handle it in the summarize method.
  }

  // Gemini does not use standard headers for API key, only Content-Type
  getHeaders () {
    return {
      'Content-Type': 'application/json'
    }
  }

  getBody (prompt) {
    // Gemini doesn't have a direct 'system' role in generateContent.
    // Prepend system prompt to user prompt for context.
    const fullPrompt = `${this.system}\n\n${prompt}`

    return JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: Number(this.temperature),
        maxOutputTokens: this.maxTokens || MAX_TOKENS
      }
    })
  }

  getMessage (data) {
    // Extract text from Gemini's response structure
    const candidates = data?.candidates || []
    const message = candidates[0]?.content?.parts[0]?.text || ''
    return message
  }

  async summarize (prompt) {
    if (prompt.length > MAX_PROMPT_LEN) prompt = prompt.substring(0, MAX_PROMPT_LEN)

    // Construct the URL with the API key as a query parameter
    // The endpoint now includes the model name, e.g., /v1beta/models/gemini-pro:generateContent
    const url = `${this.host}${this.endpoint}?key=${this.apiKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: this.getBody(prompt)
      })

      if (!response.ok) {
        const errorText = await response.text(); // Read raw response text
        console.error('Gemini API Error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      const data = await response.json();
      return this.getMessage(data);
    } catch (error) {
      console.error('Error summarizing text with Gemini:', error);
      throw error;
    }
  }
}
