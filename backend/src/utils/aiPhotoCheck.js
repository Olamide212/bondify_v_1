/**
 * aiPhotoCheck.js
 *
 * Shared AI photo validation utility.
 * Validates that an uploaded profile photo contains a real human face
 * and is not a screenshot, AI-generated image, cartoon, or photo-of-a-photo.
 */

const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Checks a profile photo for authenticity.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<{ valid: boolean, reason: string }>}
 */
const checkProfilePhotoWithAI = async (imageBuffer, mimeType = 'image/jpeg') => {
  try {
    const base64 = imageBuffer.toString('base64');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'low',
              },
            },
            {
              type: 'text',
              text: `Analyze this image for use as a dating app profile photo.

Reply ONLY in this exact JSON format (no markdown):
{"valid": true/false, "reason": "one sentence explanation"}

valid=true when: the image shows a real human face as the main subject in what appears to be a genuine personal photo.

valid=false for ANY of the following:
- screenshot of another app, website, or device screen
- photo of a screen or monitor
- AI-generated or digitally created face
- cartoon, illustration, drawing, or anime character
- no visible human face present
- face is too small, masked, or heavily obscured
- group photo with no clear single subject
- celebrity or stock photo that appears taken from the internet
- image quality too poor to determine`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return { valid: Boolean(result.valid), reason: String(result.reason || '') };
  } catch (err) {
    console.error('[aiPhotoCheck] checkProfilePhotoWithAI failed:', err.message);
    // Fail open — if the AI is unavailable, let it through for manual review
    return { valid: true, reason: 'AI check unavailable, flagged for manual review' };
  }
};

module.exports = { checkProfilePhotoWithAI };
