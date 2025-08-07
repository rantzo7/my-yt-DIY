import { Generic } from './generic.js'

const MAX_PROMPT_LEN = 10000
const MAX_TOKENS = 5000

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
    // Ensure data is an object and has a candidates property that is an array
    if (!data || typeof data !== 'object' || !Array.isArray(data.candidates)) {
      console.warn('Gemini API response data is malformed or missing candidates array:', data);
      return '';
    }

    const candidates = data.candidates; // Now we are sure candidates is an array

    if (candidates.length === 0) {
      return ''; // No candidates found
    }

    const firstCandidate = candidates[0];
    // Ensure the first candidate and its content/parts are valid
    if (!firstCandidate || typeof firstCandidate !== 'object' || !firstCandidate.content || typeof firstCandidate.content !== 'object' || !Array.isArray(firstCandidate.content.parts)) {
      console.warn('First candidate or its content/parts are malformed:', firstCandidate);
      return '';
    }

    const firstPart = firstCandidate.content.parts[0];
    // Ensure the first part and its text property are valid
    if (!firstPart || typeof firstPart !== 'object' || !firstPart.text) {
      console.warn('First part or its text is missing:', firstPart);
      return '';
    }

    return firstPart.text;
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
