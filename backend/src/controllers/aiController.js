const User = require('../models/User');
const Match = require('../models/Match');

// OpenAI client (lazy init)
let openai;
const getOpenAI = () => {
  if (!openai) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ─────────────────────────────────────────────
//  AI ICEBREAKER SUGGESTIONS
// ─────────────────────────────────────────────
const getIcebreakerSuggestions = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('user1', 'firstName interests personalities lookingFor occupation')
      .populate('user2', 'firstName interests personalities lookingFor occupation');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const isUser1 = match.user1._id.toString() === req.user._id.toString();
    const me = isUser1 ? match.user1 : match.user2;
    const them = isUser1 ? match.user2 : match.user1;

    if (!me || !them) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const prompt = `You are a dating coach helping someone start a conversation on a dating app.

My name: ${me.firstName}
My interests: ${(me.interests || []).join(', ') || 'Not specified'}
My occupation: ${me.occupation || 'Not specified'}

Their name: ${them.firstName}
Their interests: ${(them.interests || []).join(', ') || 'Not specified'}
Their occupation: ${them.occupation || 'Not specified'}

Generate exactly 3 openers — mix of: a clever pick-up line, a witty question, and a warm genuine icebreaker that references shared interests. Keep each under 30 words. No boring "Hey!" openers. Format as a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    });

    let suggestions = [];
    try {
      const raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(clean);
    } catch {
      suggestions = [response.choices[0].message.content];
    }

    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI COMPATIBILITY SCORE
// ─────────────────────────────────────────────
const getCompatibilityScore = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { userId } = req.params;

    const [me, them] = await Promise.all([
      User.findById(req.user._id).select(
        'firstName interests personalities religion lookingFor loveLanguage communicationStyle'
      ),
      User.findById(userId).select(
        'firstName interests personalities religion lookingFor loveLanguage communicationStyle'
      ),
    ]);

    if (!them) return res.status(404).json({ success: false, message: 'User not found' });

    const prompt = `You are a relationship compatibility analyst.

Person A:
- Interests: ${(me.interests || []).join(', ') || 'N/A'}
- Personalities: ${(me.personalities || []).join(', ') || 'N/A'}
- Looking for: ${me.lookingFor || 'N/A'}
- Love language: ${me.loveLanguage || 'N/A'}
- Communication style: ${me.communicationStyle || 'N/A'}

Person B:
- Interests: ${(them.interests || []).join(', ') || 'N/A'}
- Personalities: ${(them.personalities || []).join(', ') || 'N/A'}
- Looking for: ${them.lookingFor || 'N/A'}
- Love language: ${them.loveLanguage || 'N/A'}
- Communication style: ${them.communicationStyle || 'N/A'}

Analyze compatibility and respond ONLY with a JSON object like:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence summary>",
  "strengths": ["<strength1>", "<strength2>"],
  "challenges": ["<challenge1>"]
}`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.5,
    });

    let result;
    try {
      const raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { score: 70, summary: response.choices[0].message.content, strengths: [], challenges: [] };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI PROFILE BIO GENERATOR
// ─────────────────────────────────────────────
const generateBio = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { tone } = req.body;

    const user = await User.findById(req.user._id).select(
      'firstName interests occupation loveLanguage lookingFor personalities'
    );

    const prompt = `Write a short, authentic dating profile bio (max 150 words) for someone with the following details.
Tone: ${tone || 'sincere and warm'}

Name: ${user.firstName}
Occupation: ${user.occupation || 'Not specified'}
Interests: ${(user.interests || []).join(', ') || 'Not specified'}
Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
Looking for: ${user.lookingFor || 'Not specified'}
Love language: ${user.loveLanguage || 'Not specified'}

Write ONLY the bio text, no labels or extra commentary.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.9,
    });

    const bio = response.choices[0].message.content.trim();
    res.json({ success: true, data: { bio } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI DATE IDEA GENERATOR
// ─────────────────────────────────────────────
const getDateIdeas = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { matchId } = req.params;
    const { city } = req.query;

    const match = await Match.findById(matchId)
      .populate('user1', 'interests')
      .populate('user2', 'interests');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const allInterests = [
      ...(match.user1.interests || []),
      ...(match.user2.interests || []),
    ];
    const uniqueInterests = [...new Set(allInterests)];

    const prompt = `Suggest 4 creative and fun first date ideas for two people in ${city || 'any city'} who share these interests: ${uniqueInterests.join(', ') || 'general interests'}.

Mix budget options: include 1 free activity, 2 affordable options, 1 special experience.

Respond ONLY with a JSON array of objects like:
[
  { "title": "...", "description": "...", "estimatedCost": "...", "duration": "..." }
]`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.8,
    });

    let ideas = [];
    try {
      const raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      ideas = JSON.parse(clean);
    } catch {
      ideas = [];
    }

    res.json({ success: true, data: { ideas } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  BONBOT — Conversational AI Chat
// ─────────────────────────────────────────────
const chat = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages array is required' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName age interests personalities lookingFor loveLanguage occupation'
    );

    const systemPrompt = `You are BonBot, a warm, witty, and supportive AI dating assistant inside the Bondies dating app.

User profile context:
- Name: ${user.firstName}
- Age: ${user.age || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Looking for: ${user.lookingFor || 'Not specified'}
- Love language: ${user.loveLanguage || 'Not specified'}

Your capabilities:
- Give personalised dating advice and tips
- Suggest conversation ice breakers for matches
- Help craft or improve bio text
- Suggest date ideas based on shared interests
- Offer encouragement and emotional support around dating
- Help interpret confusing match behaviour

Rules:
- Keep replies concise (2-4 sentences max unless the user asks for more)
- Be warm, encouraging, and never judgmental
- If asked something unrelated to dating/relationships, gently redirect
- Never make up information about specific matches unless the user tells you about them
- Address the user by first name occasionally to feel personal`;

    const ai = getOpenAI();
    const completion = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.75,
    });

    const reply = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      data: { message: reply, role: 'assistant' },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Generate a personalised first-message suggestion for a target user's profile
// @route POST /api/ai/suggest-message
// @access Private
const suggestMessage = async (req, res, next) => {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const currentUser = await User.findById(req.user._id).lean();
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId is required.' });
    }

    const targetUser = await User.findById(targetUserId)
      .select('firstName interests occupation lookingFor religion')
      .lean();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const name        = targetUser.firstName || 'this person';
    const interests   = (targetUser.interests ?? []).slice(0, 4).join(', ');
    const lookingFor  = targetUser.lookingFor || '';
    const religion    = targetUser.religion || '';
    const occupation  = targetUser.occupation || '';

    const contextBits = [
      interests  && `interests: ${interests}`,
      lookingFor && `looking for: ${lookingFor}`,
      religion   && `religion: ${religion}`,
      occupation && `works as: ${occupation}`,
    ].filter(Boolean).join('; ');

    const prompt = `You are a confident dating coach helping someone craft an irresistible opening message on a dating app to ${name}.
${contextBits ? `Their profile: ${contextBits}.` : ''}
Write ONE short opening — choose from: a clever pick-up line, a witty observation, or a warm specific comment about their profile (max 2 sentences, under 25 words).
Be charming, bold, and specific. Use 1 emoji max. Avoid generic openers like "Hey how are you" or "You seem cool".
Reply with ONLY the message text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.85,
    });

    const suggestion = completion.choices[0].message.content.trim();
    res.json({ success: true, data: { suggestion } });
  } catch (error) {
    next(error);
  }
};

// @desc  Generate a photo comment suggestion for a specific image on a user's profile
// @route POST /api/ai/suggest-photo-comment
// @access Private
const suggestPhotoComment = async (req, res, next) => {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { targetUserId, imageIndex = 0 } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId is required.' });
    }

    const targetUser = await User.findById(targetUserId)
      .select('firstName interests occupation lookingFor religion')
      .lean();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const name       = targetUser.firstName || 'this person';
    const interests  = (targetUser.interests ?? []).slice(0, 4).join(', ');
    const occupation = targetUser.occupation || '';

    const contextBits = [
      interests  && `interests: ${interests}`,
      occupation && `works as: ${occupation}`,
    ].filter(Boolean).join('; ');

    const prompt = `You are a flirty dating coach helping someone send a charming compliment or pick-up line on a dating app to ${name}.
${contextBits ? `Their profile: ${contextBits}.` : ''}
Write ONE short, flirty, clever message — it can be a smooth pick-up line, a witty icebreaker, or a specific compliment tied to their profile (max 1-2 sentences, under 25 words).
Be playful, confident, and specific. Use 1 emoji max. Avoid clichés like "nice pic", "you're gorgeous", or "so beautiful".
Reply with ONLY the message text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.85,
    });

    const suggestion = completion.choices[0].message.content.trim();
    res.json({ success: true, data: { suggestion } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI BIO GENERATOR FROM CUSTOM PROMPT
// ─────────────────────────────────────────────
const generateBioFromPrompt = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A valid prompt is required' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests occupation loveLanguage lookingFor personalities'
    );

    const enhancedPrompt = `Write a short, authentic dating profile bio (max 150 words) for someone who describes themselves as: "${prompt.trim()}"

Additional context about the person:
Name: ${user.firstName}
Occupation: ${user.occupation || 'Not specified'}
Interests: ${(user.interests || []).join(', ') || 'Not specified'}
Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
Looking for: ${user.lookingFor || 'Not specified'}
Love language: ${user.loveLanguage || 'Not specified'}

Write ONLY the bio text, no labels or extra commentary. Make it warm, engaging, and true to their self-description.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: enhancedPrompt }],
      max_tokens: 200,
      temperature: 0.9,
    });

    const bio = response.choices[0].message.content.trim();
    res.json({ success: true, data: { bio } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI PROMPT SUGGESTIONS GENERATOR
// ─────────────────────────────────────────────
const generatePrompts = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 6 creative and diverse 3-word self-descriptions for a dating profile bio. Each should be positive, authentic, and help someone express their personality.

User context:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Mix different personality types: adventurous, creative, caring, ambitious, funny, thoughtful, etc. Each prompt should be exactly 3 words, separated by commas.

Return ONLY a JSON array of 6 strings, like: ["Adventurous, Funny, Kind", "Creative, Ambitious, Caring", ...]`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    let prompts = [];
    try {
      const raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      prompts = JSON.parse(clean);
    } catch {
      // Fallback: split by newlines and clean up
      prompts = raw.split('\n').map(p => p.trim()).filter(p => p.length > 0).slice(0, 6);
    }

    res.json({ success: true, data: { prompts } });
  } catch (error) {
    next(error);
  }
};

const generateConversationPrompts = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 8 creative and engaging conversation starter prompts for a dating profile. Each prompt should be a question or incomplete statement that encourages fun, meaningful responses.

Examples of good prompts:
- "Dating me is like..."
- "My ideal Sunday..."
- "The fastest way to my heart..."
- "You know you're my type if..."
- "My hidden talent is..."

User context:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Generate 8 diverse prompts that would work well on a dating profile. Make them fun, revealing, and spark conversation. Return ONLY a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    });

    let prompts = [];
    try {
      const raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      prompts = JSON.parse(clean);
    } catch {
      // Fallback: split by newlines and clean up
      prompts = raw.split('\n').map(p => p.trim()).filter(p => p.length > 0).slice(0, 8);
    }

    res.json({ success: true, data: { prompts } });
  } catch (error) {
    next(error);
  }
};
const suggestPost = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { context = '' } = req.body;
    const user = req.user;

    const interests = (user.interests || []).join(', ') || 'general lifestyle';
    const occupation = user.occupation || '';
    const bio = user.bio || '';

    const prompt = `You are a creative assistant for Bondify, a dating app social feed. Help a user write an engaging post.

User context:
- Interests: ${interests}
- Occupation: ${occupation ? occupation : 'not specified'}
- Bio: ${bio ? bio : 'not provided'}
${context ? `- Topic hint: ${context}` : ''}

Generate 3 different post ideas. Mix these styles:
1. A vulnerable/honest dating confession or what they're genuinely looking for in a partner
2. A playful, witty dating question or relationship green-flag post that sparks conversation
3. A fun dating-themed prompt, date idea suggestion, or love-language related thought

Each post should be 1-3 sentences, warm, and specific to a dating app audience.

Return ONLY a JSON array of 3 strings, no other text.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.85,
    });

    let suggestions = [];
    try {
      const raw   = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(clean);
    } catch {
      suggestions = [response.choices[0].message.content.trim()];
    }

    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  EXPORTS — must be after ALL function definitions
// ─────────────────────────────────────────────
module.exports = {
  getIcebreakerSuggestions,
  getCompatibilityScore,
  generateBio,
  generateBioFromPrompt,
  generatePrompts,
  generateConversationPrompts,
  getDateIdeas,
  chat,
  suggestMessage,
  suggestPhotoComment,
  suggestPost,
};