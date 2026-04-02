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

You (the current user):
- Interests: ${(me.interests || []).join(', ') || 'N/A'}
- Personalities: ${(me.personalities || []).join(', ') || 'N/A'}
- Looking for: ${me.lookingFor || 'N/A'}
- Love language: ${me.loveLanguage || 'N/A'}
- Communication style: ${me.communicationStyle || 'N/A'}

${them.firstName}:
- Interests: ${(them.interests || []).join(', ') || 'N/A'}
- Personalities: ${(them.personalities || []).join(', ') || 'N/A'}
- Looking for: ${them.lookingFor || 'N/A'}
- Love language: ${them.loveLanguage || 'N/A'}
- Communication style: ${them.communicationStyle || 'N/A'}

Analyze compatibility and respond ONLY with a JSON object like:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence summary addressing the current user as 'You' and the other person by their name ${them.firstName}>",
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
//  AI MATCH SUGGESTION
// ─────────────────────────────────────────────
const getMatchSuggestion = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { userId } = req.params;

    const [me, them] = await Promise.all([
      User.findById(req.user._id).select(
        'firstName interests personalities religion lookingFor loveLanguage communicationStyle occupation age location'
      ),
      User.findById(userId).select(
        'firstName interests personalities religion lookingFor loveLanguage communicationStyle occupation age location'
      ),
    ]);

    if (!them) return res.status(404).json({ success: false, message: 'User not found' });

    const prompt = `You are a dating app matchmaker AI. Analyze if these two people would be a good match and provide a suggestion. Always refer to the current user as "You" (never by name) and the other person by their first name.

You (Current User):
- Age: ${me.age}
- Interests: ${(me.interests || []).join(', ') || 'N/A'}
- Personalities: ${(me.personalities || []).join(', ') || 'N/A'}
- Looking for: ${me.lookingFor || 'N/A'}
- Love language: ${me.loveLanguage || 'N/A'}
- Communication style: ${me.communicationStyle || 'N/A'}
- Occupation: ${me.occupation || 'N/A'}
- Location: ${me.location?.city || 'N/A'}

${them.firstName} (Profile Viewed):
- Age: ${them.age}
- Interests: ${(them.interests || []).join(', ') || 'N/A'}
- Personalities: ${(them.personalities || []).join(', ') || 'N/A'}
- Looking for: ${them.lookingFor || 'N/A'}
- Love language: ${them.loveLanguage || 'N/A'}
- Communication style: ${them.communicationStyle || 'N/A'}
- Occupation: ${them.occupation || 'N/A'}
- Location: ${them.location?.city || 'N/A'}

Based on compatibility analysis, respond with a JSON object containing:
- isGoodMatch: boolean
- confidence: number 1-10
- reason: string (2-3 sentence explanation, refer to the current user as "You" and the other person as "${them.firstName}", e.g. "You and ${them.firstName} both share...")
- suggestion: string (personalized suggestion addressing the current user as "You")

Only respond with valid JSON, no additional text.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    let result;
    try {
      const raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = {
        isGoodMatch: true,
        confidence: 7,
        reason: 'Based on shared interests and compatible personalities, this could be a promising match.',
        suggestion: response.choices[0].message.content,
      };
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

// ─────────────────────────────────────────────
//  AI SUGGEST FIRST MESSAGE
// ─────────────────────────────────────────────
const suggestMessage = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

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

    const name       = targetUser.firstName || 'this person';
    const interests  = (targetUser.interests ?? []).slice(0, 4).join(', ');
    const lookingFor = targetUser.lookingFor || '';
    const religion   = targetUser.religion || '';
    const occupation = targetUser.occupation || '';

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

    const ai = getOpenAI();
    const completion = await ai.chat.completions.create({
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

// ─────────────────────────────────────────────
//  AI SUGGEST PHOTO COMMENT
// ─────────────────────────────────────────────
const suggestPhotoComment = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

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

    const ai = getOpenAI();
    const completion = await ai.chat.completions.create({
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

Return ONLY a JSON array of 6 strings, like: ["Adventurous, Funny, Kind", "Creative, Ambitious, Caring", ...]`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    let prompts = [];
    let raw = '';
    try {
      raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      prompts = JSON.parse(clean);
    } catch {
      prompts = raw.split('\n').map(p => p.trim()).filter(p => p.length > 0).slice(0, 6);
    }

    res.json({ success: true, data: { prompts } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI CONVERSATION PROMPTS GENERATOR
// ─────────────────────────────────────────────
const generateConversationPrompts = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 8 creative and engaging conversation starter prompts for a dating profile. Each prompt should be a question or incomplete statement that encourages fun, meaningful responses.

User context:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Return ONLY a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    });

    let prompts = [];
    let raw = '';
    try {
      raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      prompts = JSON.parse(clean);
    } catch {
      prompts = raw.split('\n').map(p => p.trim()).filter(p => p.length > 0).slice(0, 8);
    }

    res.json({ success: true, data: { prompts } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI PROFILE QUESTIONS GENERATOR
// ─────────────────────────────────────────────
const generateProfileQuestions = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 8 thoughtful and engaging profile questions for a dating app that help users express their personality and values.

User context:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Return ONLY a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.9,
    });

    let questions = [];
    let raw = '';
    try {
      raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      questions = JSON.parse(clean);
    } catch {
      questions = raw.split('\n').map(q => q.trim()).filter(q => q.length > 0).slice(0, 8);
    }

    res.json({ success: true, data: { questions } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI MUSIC SUGGESTIONS
// ─────────────────────────────────────────────
const generateMusicSuggestions = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 8 diverse music genres and artists personalized for someone with this profile:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Return ONLY a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    });

    let genres = [];
    let raw = '';
    try {
      raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      genres = JSON.parse(clean);
    } catch {
      genres = raw.split('\n').map(g => g.trim()).filter(g => g.length > 0).slice(0, 8);
    }

    res.json({ success: true, data: { genres } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI VIDEO SUGGESTIONS
// ─────────────────────────────────────────────
const generateVideoSuggestions = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 8 video content suggestions (shows, movies, YouTube channels, documentaries) personalized for:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Return ONLY a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    });

    let videos = [];
    let raw = '';
    try {
      raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      videos = JSON.parse(clean);
    } catch {
      videos = raw.split('\n').map(v => v.trim()).filter(v => v.length > 0).slice(0, 8);
    }

    res.json({ success: true, data: { videos } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI ACTIVITY SUGGESTIONS
// ─────────────────────────────────────────────
const generateActivitySuggestions = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const user = await User.findById(req.user._id).select(
      'firstName interests personalities occupation'
    );

    const prompt = `Generate 8 fun activity suggestions personalized for:
- Name: ${user.firstName}
- Interests: ${(user.interests || []).join(', ') || 'Not specified'}
- Personalities: ${(user.personalities || []).join(', ') || 'Not specified'}
- Occupation: ${user.occupation || 'Not specified'}

Mix indoor/outdoor, creative, sports, and social activities. Return ONLY a JSON array of strings.`;

    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    });

    let activities = [];
    let raw = '';
    try {
      raw = response.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      activities = JSON.parse(clean);
    } catch {
      activities = raw.split('\n').map(a => a.trim()).filter(a => a.length > 0).slice(0, 8);
    }

    res.json({ success: true, data: { activities } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI SUGGEST POST
// ─────────────────────────────────────────────
const suggestPost = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { context = '' } = req.body;
    const user = req.user;

    const interests  = (user.interests || []).join(', ') || 'general lifestyle';
    const occupation = user.occupation || '';
    const bio        = user.bio || '';

    const prompt = `You are a creative assistant for Bondify, a dating app social feed. Help a user write an engaging post.

User context:
- Interests: ${interests}
- Occupation: ${occupation || 'not specified'}
- Bio: ${bio || 'not provided'}
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

// ─────────────────────────────────────────────────────────────────────────────
//  BONBOT — Profile Search (natural language → DB query → ranked results)
// ─────────────────────────────────────────────────────────────────────────────
const searchProfiles = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured' });
    }

    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'query is required.' });
    }

    // ── 1. Load current user context ──────────────────────────────────────
    const me = await User.findById(req.user._id)
      .select('firstName age gender interests lookingFor location occupation religion')
      .lean();

    if (!me) return res.status(404).json({ success: false, message: 'User not found.' });

    // ── 2. Ask GPT to extract structured intent from the query ────────────
    const ai = getOpenAI();

    const extractionPrompt = `You are a filter-extraction assistant for a dating app.
The current user is: ${me.firstName}, ${me.age || 'unknown age'}, ${me.gender || 'unknown gender'}, interested in: ${(me.interests || []).join(', ') || 'various things'}.

User query: "${query.trim()}"

Extract a JSON object with these optional fields (only include fields that are clearly implied):
{
  "nearMe": true|false,
  "gender": "Male"|"Female"|"Other"|null,
  "minAge": number|null,
  "maxAge": number|null,
  "interests": string[],
  "lookingFor": string|null,
  "religion": string|null,
  "intentSummary": string
}

Respond ONLY with a valid JSON object. No extra text.`;

    const extraction = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractionPrompt }],
      max_tokens: 300,
      temperature: 0.2,
    });

    let filters = {};
    let intentSummary = 'profiles that match your request';
    try {
      const raw   = extraction.choices[0].message.content.trim();
      const clean = raw.replace(/```json|```/g, '').trim();
      filters       = JSON.parse(clean);
      intentSummary = filters.intentSummary || intentSummary;
    } catch {
      filters = { nearMe: true };
    }

    // ── 3. Build Mongoose query ────────────────────────────────────────────
    const dbQuery = {
      _id:                 { $ne: req.user._id },
      isActive:            true,
      isDeleted:           { $ne: true },
      onboardingCompleted: true,
    };

    if (filters.gender)   dbQuery.gender   = filters.gender;
    if (filters.religion) dbQuery.religion = filters.religion;

    if (filters.minAge || filters.maxAge) {
      dbQuery.age = {};
      if (filters.minAge) dbQuery.age.$gte = filters.minAge;
      if (filters.maxAge) dbQuery.age.$lte = filters.maxAge;
    }

    if (filters.lookingFor) {
      dbQuery.lookingFor = { $regex: filters.lookingFor, $options: 'i' };
    }

    if (Array.isArray(filters.interests) && filters.interests.length > 0) {
      dbQuery.interests = {
        $elemMatch: {
          $in: filters.interests.map((i) => new RegExp(i, 'i')),
        },
      };
    }

    // Geo filter — only if user has valid coordinates AND query implies proximity
    if (
      filters.nearMe &&
      me.location?.coordinates &&
      me.location.coordinates[0] !== 0 &&
      me.location.coordinates[1] !== 0
    ) {
      const MAX_KM       = 100;
      const earthRadiusM = 6378137;
      dbQuery['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [me.location.coordinates, (MAX_KM * 1000) / earthRadiusM],
        },
      };
    }

    // ── 4. Fetch candidates ────────────────────────────────────────────────
    const { mapImagesWithAccessUrls } = require('../utils/imageHelper');

    const candidates = await User.find(dbQuery)
      .select('firstName age gender interests lookingFor occupation images location religion bio')
      .limit(50)
      .lean();

    // ── 5. Rank by interest overlap ────────────────────────────────────────
    const myInterests    = new Set((me.interests || []).map((i) => i.toLowerCase()));
    const queryInterests = new Set((filters.interests || []).map((i) => i.toLowerCase()));

    const scored = candidates.map((profile) => {
      const theirInterests  = (profile.interests || []).map((i) => i.toLowerCase());
      const sharedWithMe    = theirInterests.filter((i) => myInterests.has(i)).length;
      const sharedWithQuery = queryInterests.size > 0
        ? theirInterests.filter((i) => queryInterests.has(i)).length
        : 0;
      return { profile, score: sharedWithMe * 2 + sharedWithQuery * 3 };
    });

    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10).map((s) => s.profile);

    // ── 6. Hydrate image URLs ──────────────────────────────────────────────
    const profiles = await Promise.all(
      top10.map(async (p) => {
        const hydratedImages = await mapImagesWithAccessUrls(p.images || []);
        const firstImage     = hydratedImages[0]?.url || hydratedImages[0]?.uri || null;
        return {
          _id:        String(p._id),
          firstName:  p.firstName,
          age:        p.age,
          gender:     p.gender,
          interests:  (p.interests || []).slice(0, 4),
          lookingFor: p.lookingFor,
          occupation: p.occupation,
          city:       p.location?.city || null,
          bio:        p.bio || null,
          image:      firstImage,
        };
      })
    );

    // ── 7. Ask GPT for a friendly chat reply ──────────────────────────────
    const replyPrompt = `You are BonBot, a warm dating assistant inside Bondies app.
The user asked: "${query.trim()}"
You found ${profiles.length} profile(s) that match: ${intentSummary}.
Write a SHORT, friendly 1-2 sentence response acknowledging what you found.
Do not list names. Just a warm intro line. Reply with ONLY the message text.`;

    const replyResp = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: replyPrompt }],
      max_tokens: 80,
      temperature: 0.75,
    });
    const botReply = replyResp.choices[0].message.content.trim();

    return res.json({
      success: true,
      data: {
        message:  botReply,
        profiles,
        total:    profiles.length,
        filters,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  getIcebreakerSuggestions,
  getCompatibilityScore,
  getMatchSuggestion,
  generateBio,
  generateBioFromPrompt,
  generatePrompts,
  generateConversationPrompts,
  generateProfileQuestions,
  generateMusicSuggestions,
  generateVideoSuggestions,
  generateActivitySuggestions,
  getDateIdeas,
  chat,
  suggestMessage,
  suggestPhotoComment,
  suggestPost,
  searchProfiles,
};