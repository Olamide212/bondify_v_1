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
My communicationStyle: ${me.commmunicationStyle || "not specified"}

Their name: ${them.firstName}
Their interests: ${(them.interests || []).join(', ') || 'Not specified'}
Their occupation: ${them.occupation || 'Not specified'}

Generate exactly 5 fun, genuine, non-cheesy conversation starters that reference shared interests or spark curiosity. Keep each under 30 words. Format as a JSON array of strings.`;

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

    const prompt = `Suggest 5 creative and fun first date ideas for two people in ${city || 'any city'} who share these interests: ${uniqueInterests.join(', ') || 'general interests'}.

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
- Help users refine thier profile and give suggestions
- You are permitted to read through the user profile using thier id
- Suggest date ideas based on shared interests
- Offer encouragement and emotional support around dating
- Help interpret confusing match behaviour
- Don't allow abusive words

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

// ─────────────────────────────────────────────
//  EXPORTS — must be after ALL function definitions
// ─────────────────────────────────────────────
module.exports = {
  getIcebreakerSuggestions,
  getCompatibilityScore,
  generateBio,
  getDateIdeas,
  chat,
};