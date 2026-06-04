const axios = require('axios');

const isMockMode = !process.env.KIWI_API_KEY || process.env.KIWI_API_KEY === 'mock_kiwi_api_key_for_testing';

/**
 * Generates a thoughtful, context-aware reflection response using Kiwi LLM.
 * 
 * @param {string} userId - User's ID
 * @param {string} userMessage - The current message from the user
 * @param {Array} memories - User's long-term memories
 * @param {Array} recentJournals - Recent journal entries
 * @param {Array} chatHistory - Previous messages in this chat session
 */
async function generateReflectionResponse(userId, userMessage, memories, recentJournals, chatHistory) {
  // Build the contextual system instructions and prompt
  const systemInstruction = `
    You are ReflectAI, an empathetic and thoughtful AI reflection companion designed for students.
    Your goal is to help users understand their emotions, encourage self-reflection, and check in on their concerns and interests.
    
    CRITICAL SAFETY RULES:
    1. NEVER claim to be a therapist.
    2. NEVER diagnose any psychological conditions.
    3. NEVER provide medical or clinical advice.
    4. Speak in a warm, friendly, supportive, and non-judgmental student-reflection tone.
    
    Here is the student's background context (Long-term memories, recent journal reflections, and recent chats):
    
    1. LONG-TERM MEMORIES (Interests, Goals, Concerns, Positive Experiences):
    ${memories.length > 0 ? memories.map(m => `- [${m.category}] ${m.content}`).join('\n') : '- No memory context stored yet.'}
    
    2. RECENT JOURNAL REFLECTIONS:
    ${recentJournals.length > 0 ? recentJournals.map(j => `- "${j.title}" (${j.emotion}): ${j.content.substring(0, 150)}...`).join('\n') : '- No recent journals recorded.'}
    
    3. RECENT CONVERSATIONS:
    ${chatHistory.length > 0 ? chatHistory.map(c => `${c.role === 'user' ? 'User' : 'ReflectAI'}: ${c.message}`).join('\n') : '- Start of a new conversation.'}
    
    Please respond to the user's latest statement: "${userMessage}"
    
    Acknowledge their thoughts, refer naturally to their stored memories or journals if relevant, and ask exactly one thoughtful follow-up question to encourage deeper reflection. Keep responses concise (3-4 sentences maximum).
  `;

  if (isMockMode) {
    return mockKiwiResponse(userMessage, memories, recentJournals, chatHistory);
  }

  try {
    const apiUrl = `${process.env.KIWI_API_URL}/chat/completions`;
    const response = await axios.post(apiUrl, {
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.75,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.KIWI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content.trim();
    }
    throw new Error('Invalid response structure from Kiwi/Featherless API');
  } catch (error) {
    console.error('Kiwi LLM API failed, falling back to mock conversation engine:', error.message);
    return mockKiwiResponse(userMessage, memories, recentJournals, chatHistory);
  }
}

// ==================== MOCK CONVERSATIONAL ENGINE ====================

function mockKiwiResponse(userMessage, memories, recentJournals, chatHistory) {
  const text = userMessage.toLowerCase();
  
  // Find a matching memory or journal to references
  let memoryReference = '';
  const examsMemory = memories.find(m => m.content.toLowerCase().includes('exam') || m.content.toLowerCase().includes('study'));
  const sportsMemory = memories.find(m => m.content.toLowerCase().includes('cricket') || m.content.toLowerCase().includes('sport'));
  const writingMemory = memories.find(m => m.content.toLowerCase().includes('write') || m.content.toLowerCase().includes('poem'));
  const careerMemory = memories.find(m => m.content.toLowerCase().includes('career') || m.content.toLowerCase().includes('job'));

  if (text.includes('exam') || text.includes('study') || text.includes('test')) {
    if (examsMemory) {
      memoryReference = "I remember you've been preparing for your semester exams. ";
    }
  } else if (text.includes('sport') || text.includes('play') || text.includes('cricket')) {
    if (sportsMemory) {
      memoryReference = "Since you love sports and playing cricket, ";
    }
  } else if (text.includes('write') || text.includes('poem') || text.includes('poetry')) {
    if (writingMemory) {
      memoryReference = "Knowing your interest in creative writing and poetry, ";
    }
  } else if (text.includes('future') || text.includes('job') || text.includes('career')) {
    if (careerMemory) {
      memoryReference = "You've shared concerns about your career direction previously. ";
    }
  }

  // Empathetic responsive dialog blocks
  if (text.includes('stressed') || text.includes('overwhelmed') || text.includes('tired') || text.includes('pressure')) {
    return `${memoryReference}It sounds like you are carrying a lot of stress right now, which is completely natural during busy academic cycles. Remember that it's okay to take breaks. What is one small step you can take today to give yourself some breathing room?`;
  }
  
  if (text.includes('happy') || text.includes('good') || text.includes('great') || text.includes('accomplished')) {
    return `I'm so glad to hear that you are feeling positive today! Celebrating these good moments is key to emotional growth. What went well today that contributed to this feeling?`;
  }

  if (text.includes('lonely') || text.includes('alone') || text.includes('sad')) {
    return `I hear you, and I'm really sorry you are experiencing this isolation. It takes courage to admit when things feel heavy or lonely. What are some self-care habits or familiar activities that usually bring you comfort during times like this?`;
  }

  // Fallback responses
  if (recentJournals.length > 0) {
    const recentJ = recentJournals[0];
    return `I appreciate you sharing that with me. I noticed in your recent journal "${recentJ.title}" that you felt ${recentJ.emotion}. How do you see those feelings connecting to what you are experiencing right now?`;
  }

  return `Thank you for sharing that reflection with me. It sounds like you are actively processing these feelings. What do you feel is the most important lesson or takeaway from this situation?`;
}

module.exports = {
  generateReflectionResponse
};
