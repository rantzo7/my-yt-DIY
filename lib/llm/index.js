import { Anthropic } from './providers/anthropic.js'
import { Generic } from './providers/generic.js'
import { Gemini } from './providers/gemini.js' // Import Gemini provider

export async function summarize (
  system,
  prompt,
  llmSettings
) {
  try {
    let llm
    if (llmSettings.host.includes('api.anthropic.com')) {
      llm = new Anthropic(system, llmSettings)
    } else if (llmSettings.host.includes('generativelanguage.googleapis.com')) { // Check for Google Gemini host
      llm = new Gemini(system, llmSettings)
    } else {
      llm = new Generic(system, llmSettings)
    }

    return llm.summarize(prompt)
  } catch (e) {
    console.error('Error in LLM summarization:', e)
    return null
  }
}
