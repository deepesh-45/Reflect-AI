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
  const content = text.toLowerCase();
  
  // 1. Identify themes based on keywords
  let theme = 'general';
  if (content.includes('stress') || content.includes('exam') || content.includes('study') || content.includes('overwhelmed') || content.includes('pressure')) {
    theme = 'stress';
  } else if (content.includes('sad') || content.includes('hurt') || content.includes('cry') || content.includes('bad') || content.includes('broken')) {
    theme = 'sad';
  } else if (content.includes('lonely') || content.includes('alone') || content.includes('miss') || content.includes('empty')) {
    theme = 'lonely';
  } else if (content.includes('happy') || content.includes('good') || content.includes('great') || content.includes('glad') || content.includes('grateful')) {
    theme = 'happy';
  }

  // 2. Select vocabulary and core ideas from input text
  const words = text.split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
    .filter(w => w.length > 4 && !['about', 'would', 'could', 'should', 'their', 'there', 'think', 'today', 'really', 'feeling'].includes(w));
  
  const keyword1 = words[0] || 'silence';
  const keyword2 = words[1] || 'thoughts';
  const keyword3 = words[2] || 'journey';

  // 3. Define stanzas for themes and styles
  let poem = '';

  if (style === 'Free Verse') {
    if (theme === 'stress') {
      poem = `The clock ticks, a heavy weight,
surrounded by the whispers of "${keyword1}".
I carry the books, the expectations, the noise,
but here, in this quiet moment,
I breathe.
I let go of the pressure,
recognizing that my worth is not defined by "${keyword2}".
Tomorrow is a new day,
and I am enough.`;
    } else if (theme === 'sad') {
      poem = `A quiet shadow falls across the room,
holding the echo of "${keyword1}".
It is okay to sit in the dark for a while,
to feel the weight of "${keyword2}".
Tears are just thoughts we cannot speak.
I listen to the rain outside,
knowing that even the greyest sky
eventually clears for "${keyword3}".`;
    } else if (theme === 'lonely') {
      poem = `An empty space beside me,
a quiet echo of "${keyword1}".
I look at the stars, wondering
if someone else is looking too.
This feeling of "${keyword2}" is a heavy coat,
but underneath, my heart is warm.
I am on a bridge to somewhere new,
walking gently, step by step.`;
    } else if (theme === 'happy') {
      poem = `A sudden burst of light,
carrying the warmth of "${keyword1}".
I want to hold this feeling in my hands,
a bright bead of "${keyword2}" and hope.
The world is open, wide and green,
and in this brief, beautiful hour,
I am simply glad to be on this "${keyword3}".`;
    } else {
      poem = `Thoughts drift like autumn leaves,
spinning in the gentle air.
I catch the word "${keyword1}" as it falls.
We walk through seasons of change,
seeking a quiet place to rest,
listening to the stories of "${keyword2}"
and finding our way home.`;
    }
  }

  else if (style === 'Reflective') {
    if (theme === 'stress') {
      poem = `The storm of study and the crowded mind,
Leave simple peace and quiet far behind.
Yet in this pause, I seek a softer space,
To look at "${keyword1}" and find my place.
The race will run, the grades will fade away,
But who I am remains beyond today.
So let the worries of "${keyword2}" take flight,
And rest under the comfort of the night.`;
    } else if (theme === 'sad') {
      poem = `A gentle rain falls soft upon the stone,
A quiet reminder we are not alone.
Though "${keyword1}" has made the spirit weak,
There is a strength in words we cannot speak.
I look within, to find the hidden spark,
That guides me gently through the deepest dark.
With "${keyword2}" I slowly learn to grow,
And let the heavy, troubled waters flow.`;
    } else if (theme === 'lonely') {
      poem = `The evening falls, the shadows grow so long,
I search the silence for a familiar song.
Though "${keyword1}" whispers in the empty air,
I find a quiet courage hidden there.
For in this solitude, I learn to see,
The peaceful home that lives inside of me.
No longer running from the weight of "${keyword2}",
I walk this path, and start my life anew.`;
    } else if (theme === 'happy') {
      poem = `A golden light breaks through the morning pane,
A sweet release from sorrow and the rain.
With "${keyword1}" my heavy heart takes flight,
And steps into the warm and healing light.
The simple joy of being here today,
Has washed the troubles of "${keyword2}" away.
A quiet gratitude, so deep and true,
Begins to build the path I travel to.`;
    } else {
      poem = `I watch the river roll towards the sea,
And wonder what the future holds for me.
The words of "${keyword1}" are written on the page,
A gentle guide for every passing stage.
We look behind, to see how far we've grown,
And face the wide, beautiful unknown.
With every "${keyword2}" we learn to find,
A peaceful shelter in a quiet mind.`;
    }
  }

  else if (style === 'Motivational') {
    if (theme === 'stress') {
      poem = `Stand tall, though mountain peaks of "${keyword1}" arise,
Look upward, keep your focus on the skies.
The pressure of "${keyword2}" is only here to mould,
A spirit stronger, courageous, and bold.
You are the author of the story you write,
Step through the darkness and into the light.
Take a deep breath, believe in the grind,
Leave every heavy, doubting thought behind!`;
    } else if (theme === 'sad') {
      poem = `Though tears may fall and blur the road ahead,
Remember all the gentle words you said.
The pain of "${keyword1}" is not the final page,
But just a temporary stage.
Rise up, rebuild, and let your courage grow,
You have a fire that the world will know.
Out of the ashes of "${keyword2}" you will rise,
With hope and passion shining in your eyes!`;
    } else if (theme === 'lonely') {
      poem = `Though walking all alone in "${keyword1}"'s cold air,
Remember there is strength inside you there.
You do not need a crowd to make you whole,
You hold a brilliant light inside your soul.
Keep stepping forward, let your footsteps trace,
A path of hope, of confidence, and grace.
The world is waiting for the truth of you,
Stand strong, stand proud, and start your day anew!`;
    } else if (theme === 'happy') {
      poem = `Run forward with the wind upon your face,
And bring your joy to every empty place!
With "${keyword1}" let your spirit sing,
Celebrate the beauty that the mornings bring.
The fire of "${keyword2}" will light the way,
To make the most of this amazing day.
Keep building dreams, keep reaching for the sky,
Spread out your wings, it is your time to fly!`;
    } else {
      poem = `Every small step upon this winding road,
Brings you much closer to your true abode.
Though "${keyword1}" may test your patience now,
You will get through this, keep your solemn vow.
Believe in "${keyword2}" and let your vision guide,
With hope and resolution side by side.
The future waits, so open up the door,
And be the strength you've always waited for!`;
    }
  }

  else if (style === 'Emotional') {
    if (theme === 'stress') {
      poem = `It is so heavy, this endless, noisy race,
I feel the tears behind my smiling face.
The fear of "${keyword1}" is wrapping tight,
And keeping me awake into the night.
But in this silent page, I lay it down,
The heavy books, the pressure, and the crown.
I tell myself, in whispers soft and deep,
It is okay to rest, to breathe, to sleep.`;
    } else if (theme === 'sad') {
      poem = `A broken melody, a soft and aching sigh,
I ask the quiet walls the reason why.
The shadow of "${keyword1}" is sitting near,
Holding the heavy weight of every tear.
I feel the sorrow deep within my chest,
A tired heart that only wants to rest.
But even in this cold and dark embrace,
I find a gentle, healing saving grace.`;
    } else if (theme === 'lonely') {
      poem = `The silence of the room is like a wall,
I listen for a voice that doesn't call.
The ache of "${keyword1}" is hard to bear,
I wrap my arms around the empty air.
But in this quiet space, I feel a spark,
A soft, enduring light within the dark.
I am my own companion on this road,
Gently carrying the heavy load.`;
    } else if (theme === 'happy') {
      poem = `My heart overflows with a sweet, gentle light,
Like stars that softly illuminate the night.
With "${keyword1}" I feel the weight depart,
A warm, healing current filling up my heart.
The simple beauty of this quiet peace,
Has brought my troubled soul a sweet release.
I hold this precious moment close to me,
Grateful for the joy that sets me free.`;
    } else {
      poem = `I feel the depth of all these shifting tides,
The quiet spaces where the spirit hides.
The memory of "${keyword1}" is soft and clear,
A gentle presence that is always near.
We feel so deeply, carry so much weight,
As we walk forward through the open gate.
With "${keyword2}" we learn to understand,
And hold our hearts within a gentle hand.`;
    }
  }

  return poem;
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
