const { GoogleGenerativeAI } = require('@google/generative-ai');

const isMockMode = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock_gemini_api_key_for_testing';

let genAI;
let model;

if (!isMockMode) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini Service initialized with live API key.');
  } catch (error) {
    console.error('Gemini Service initialization failed, falling back to mock mode:', error.message);
  }
} else {
  console.log('Gemini Service running in Mock mode.');
}

/**
 * Detects the dominant emotion from the text.
 * Supported: Happy, Sad, Stressed, Angry, Excited, Lonely, Neutral
 */
async function detectEmotion(text) {
  if (isMockMode || !model) {
    return mockEmotionDetection(text);
  }

  try {
    const prompt = `
      You are an emotional intelligence agent. Analyze the following student journal entry:
      "${text}"

      Determine:
      1. The dominant emotion (Must be exactly one of: Happy, Sad, Stressed, Angry, Excited, Lonely, Neutral).
      2. The confidence score (integer percentage between 0 and 100).
      3. A brief, supportive, one-sentence summary of why they feel this way.

      Format your response as a strict JSON object with fields: "emotion", "confidence", and "summary". Do not return markdown block quotes.
    `;

    const result = await model.generateContent(prompt);
    const resultText = result.response.text().trim();
    
    // Parse JSON safely
    const cleanJson = resultText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);
    return {
      emotion: data.emotion || 'Neutral',
      confidence: data.confidence || 50,
      summary: data.summary || 'Emotion parsed from text.'
    };
  } catch (error) {
    console.error('Gemini Emotion Detection failed, falling back to mock:', error.message);
    return mockEmotionDetection(text);
  }
}

/**
 * Extracts long-term memories from the journal entry.
 */
async function extractMemories(text) {
  if (isMockMode || !model) {
    return mockMemoryExtraction(text);
  }

  try {
    const prompt = `
      You are a context extraction assistant. Analyze this student journal entry:
      "${text}"

      Extract important personal facts, preferences, goals, concerns, or recurring events.
      Categorize each extracted memory into one of these: "Interests", "Goals", "Concerns", "Positive Experiences", "Recurring Events".
      
      Format the response as a strict JSON array of objects, where each object has fields "content" (string, max 10 words) and "category" (string). Return an empty array if nothing fits.
      Example: [{"content": "Preparing for semester exams", "category": "Goals"}]
      Do not return markdown block quotes.
    `;

    const result = await model.generateContent(prompt);
    const resultText = result.response.text().trim();
    const cleanJson = resultText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini Memory Extraction failed, falling back to mock:', error.message);
    return mockMemoryExtraction(text);
  }
}

/**
 * Generates weekly reflection summary based on the list of journal entries.
 */
async function generateWeeklySummary(entries) {
  if (entries.length === 0) {
    return 'No entries found for this week. Start journaling to compile your weekly reflection.';
  }

  const combinedText = entries.map(e => `[${e.emotion}] ${e.title}: ${e.content}`).join('\n\n');

  if (isMockMode || !model) {
    return `Looking back at your week, you expressed feelings of ${[...new Set(entries.map(e => e.emotion))].join(', ')}. Keep writing and reflecting on your experiences.`;
  }

  try {
    const prompt = `
      You are a reflection mentor. Here are a student's journal entries from the past week:
      ${combinedText}

      Synthesize these entries into a warm, empathetic, and encouraging weekly reflection summary (max 3 sentences). Identify patterns or progress and suggest a gentle area of focus for the upcoming week.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini Weekly Summary failed, falling back to mock:', error.message);
    return `This week shows a journey through various feelings including ${[...new Set(entries.map(e => e.emotion))].join(', ')}. You are doing a wonderful job checking in with your emotions.`;
  }
}

/**
 * Converts a journal entry into a poem.
 */
async function generatePoem(text, style) {
  if (isMockMode || !model) {
    return mockPoemGeneration(text, style);
  }

  try {
    const prompt = `
      Transform the emotions and thoughts in this journal entry into a beautiful poem:
      "${text}"

      The style of the poem must be: ${style} (e.g. Free Verse, Reflective, Motivational, or Emotional).
      Make it short, moving, and meaningful.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini Poem Generation failed, falling back to mock:', error.message);
    return mockPoemGeneration(text, style);
  }
}

/**
 * Rewrites text to improve depth and vocabulary.
 */
async function enhanceWriting(text, action) {
  if (isMockMode || !model) {
    return mockWritingEnhancement(text, action);
  }

  try {
    const prompt = `
      You are a supportive writing assistant. Adjust the expression of the following thought:
      "${text}"

      Apply this rewrite action: "${action}" (e.g., "Improve Expression", "Improve Vocabulary", "Correct Grammar", "Enhance Emotional Depth", "Rewrite Thoughtfully").
      Provide only the rewritten output. Keep it sounding natural and authentic to a student's perspective.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini Writing Assistant failed, falling back to mock:', error.message);
    return mockWritingEnhancement(text, action);
  }
}

// ==================== MOCK FALLBACKS ====================

function mockEmotionDetection(text) {
  const content = text.toLowerCase();
  let emotion = 'Neutral';
  let confidence = 75;
  let summary = 'You are maintaining a steady, neutral state today.';

  if (content.includes('stress') || content.includes('exam') || content.includes('fail') || content.includes('overwhelmed')) {
    emotion = 'Stressed';
    confidence = 85;
    summary = 'Academic workloads or general pressure appear to be triggering stress.';
  } else if (content.includes('sad') || content.includes('cry') || content.includes('hurt') || content.includes('bad')) {
    emotion = 'Sad';
    confidence = 80;
    summary = 'It seems you are feeling low or processing some difficult circumstances.';
  } else if (content.includes('angry') || content.includes('hate') || content.includes('annoyed') || content.includes('mad')) {
    emotion = 'Angry';
    confidence = 78;
    summary = 'Frustration or conflict seems to be causing anger right now.';
  } else if (content.includes('happy') || content.includes('good') || content.includes('great') || content.includes('smile') || content.includes('love')) {
    emotion = 'Happy';
    confidence = 90;
    summary = 'Positive experiences or general satisfaction are boosting your mood.';
  } else if (content.includes('excite') || content.includes('awesome') || content.includes('wow')) {
    emotion = 'Excited';
    confidence = 88;
    summary = 'You are feeling highly energized and enthusiastic about something.';
  } else if (content.includes('lonely') || content.includes('alone') || content.includes('miss')) {
    emotion = 'Lonely';
    confidence = 82;
    summary = 'A sense of isolation or missing someone is affecting your evening.';
  }

  return { emotion, confidence, summary };
}

function mockMemoryExtraction(text) {
  const content = text.toLowerCase();
  const memories = [];

  if (content.includes('exam') || content.includes('study') || content.includes('semester')) {
    memories.push({ content: 'Preparing for semester exams', category: 'Goals' });
  }
  if (content.includes('cricket') || content.includes('football') || content.includes('sport')) {
    memories.push({ content: 'Loves sports', category: 'Interests' });
  }
  if (content.includes('poem') || content.includes('poetry') || content.includes('write')) {
    memories.push({ content: 'Interested in creative writing', category: 'Interests' });
  }
  if (content.includes('career') || content.includes('job') || content.includes('placement')) {
    memories.push({ content: 'Concerned about career path', category: 'Concerns' });
  }
  if (content.includes('friend') || content.includes('fight') || content.includes('talk')) {
    memories.push({ content: 'Focusing on peer communication', category: 'Concerns' });
  }

  // Fallback memory if text has length but no match
  if (memories.length === 0 && text.trim().length > 15) {
    memories.push({ content: 'Shared reflections on daily routine', category: 'Recurring Events' });
  }

  return memories;
}

function mockPoemGeneration(text, style) {
  return `[Mock ${style} Poetry]
A shadow walks the empty lane,
Gently carrying the day's heavy strain,
Yet in this silence, small and deep,
A quiet promise we still keep.
To rise, to breathe, to learn to see,
The peaceful strength we hold in fee.`;
}

function mockWritingEnhancement(text, action) {
  let cleaned = text.trim();
  // Ensure the text ends with a punctuation mark
  if (cleaned && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  // Capitalize first letter of each sentence
  cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  if (action === 'Improve Vocabulary') {
    return cleaned
      .replace(/\bgood\b/gi, 'wonderful')
      .replace(/\bbad\b/gi, 'disheartening')
      .replace(/\bhappy\b/gi, 'elated')
      .replace(/\bsad\b/gi, 'melancholic')
      .replace(/\bstressed\b/gi, 'overwhelmed')
      .replace(/\bangry\b/gi, 'frustrated')
      .replace(/\btired\b/gi, 'exhausted')
      .replace(/\bhard\b/gi, 'challenging')
      .replace(/\bvery\b/gi, 'profoundly');
  }

  if (action === 'Improve Expression') {
    return cleaned
      .replace(/\bi think\b/gi, 'it feels as though')
      .replace(/\bi feel\b/gi, 'I find myself experiencing')
      .replace(/\bi want to\b/gi, 'my aspiration is to')
      .replace(/\bi don't know\b/gi, 'I am currently exploring')
      .replace(/\bi hope\b/gi, 'I remain optimistic that')
      .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase()); // Re-capitalize after replacement
  }

  if (action === 'Correct Grammar') {
    return cleaned
      .replace(/\bi\b/g, 'I')
      .replace(/\bi'm\b/gi, "I'm")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bisnt\b/gi, "isn't")
      .replace(/\bwasnt\b/gi, "wasn't")
      .replace(/\bshouldnt\b/gi, "shouldn't")
      .replace(/\bwouldnt\b/gi, "wouldn't");
  }

  if (action === 'Enhance Emotional Depth') {
    const reflections = [
      "This moment carries a quiet significance, prompting me to look deeper within.",
      "In processing these emotions, I am learning to appreciate the journey of growth.",
      "It is a reminder that every feeling, no matter how heavy, holds space for self-discovery.",
      "Acknowledging this allows me to find a sense of clarity amidst the complexity."
    ];
    // Semi-deterministic choice based on text length
    const idx = text.length % reflections.length;
    return `${cleaned} ${reflections[idx]}`;
  }

  if (action === 'Rewrite Thoughtfully') {
    return `Looking back on this reflection: "${cleaned}" I realize that taking a step back and giving myself grace is a key part of my personal progression.`;
  }

  return cleaned;
}

module.exports = {
  detectEmotion,
  extractMemories,
  generateWeeklySummary,
  generatePoem,
  enhanceWriting
};
