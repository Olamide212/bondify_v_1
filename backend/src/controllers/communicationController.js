/**
 * Communication Controller
 * 
 * Handles communication score and feedback operations.
 */

const CommunicationFeedback = require('../models/CommunicationFeedback');
const User = require('../models/User');
const Match = require('../models/Match');

/**
 * Score calculation weights for each feedback type
 */
const FEEDBACK_WEIGHTS = {
  // Positive impacts
  responsive: 5,
  friendly: 3,
  genuine: 4,
  // Negative impacts
  slow_to_reply: -2,
  unresponsive: -5,
  suspicious: -15,
  inappropriate: -10,
};

/**
 * Score thresholds for each level
 */
const SCORE_LEVELS = {
  excellent: 80,    // 80-100
  good: 65,         // 65-79
  average: 50,      // 50-64
  slow: 35,         // 35-49
  unresponsive: 20, // 20-34
  suspicious: 0,    // 0-19 (or high suspicious flags)
};

/**
 * Calculate communication level from score and feedback breakdown
 */
const calculateLevel = (score, feedbackBreakdown) => {
  // If too many suspicious/inappropriate flags, override to suspicious
  const dangerFlags = (feedbackBreakdown?.suspicious || 0) + (feedbackBreakdown?.inappropriate || 0);
  if (dangerFlags >= 3) {
    return 'suspicious';
  }
  
  // Otherwise, base on score
  if (score >= SCORE_LEVELS.excellent) return 'excellent';
  if (score >= SCORE_LEVELS.good) return 'good';
  if (score >= SCORE_LEVELS.average) return 'average';
  if (score >= SCORE_LEVELS.slow) return 'slow';
  if (score >= SCORE_LEVELS.unresponsive) return 'unresponsive';
  return 'suspicious';
};

/**
 * Submit feedback about a user's communication
 * POST /api/communication/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { aboutUserId, matchId, feedbackType, comment, messagesExchanged } = req.body;
    
    // Validate required fields
    if (!aboutUserId || !matchId || !feedbackType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: aboutUserId, matchId, feedbackType',
      });
    }
    
    // Validate feedback type
    const validTypes = ['responsive', 'friendly', 'genuine', 'slow_to_reply', 'unresponsive', 'suspicious', 'inappropriate'];
    if (!validTypes.includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type',
      });
    }
    
    // Can't give feedback about yourself
    if (fromUserId === aboutUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit feedback about yourself',
      });
    }
    
    // Verify the match exists and involves both users
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }
    
    const matchUsers = match.users.map(u => u.toString());
    if (!matchUsers.includes(fromUserId) || !matchUsers.includes(aboutUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Both users must be part of this match',
      });
    }
    
    // Calculate days since match
    const daysSinceMatch = Math.floor(
      (Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Create or update feedback
    const feedbackData = {
      fromUser: fromUserId,
      aboutUser: aboutUserId,
      matchId,
      feedbackType,
      comment: comment?.substring(0, 500),
      messagesExchanged: messagesExchanged || 0,
      daysSinceMatch,
      processed: false,
    };
    
    // Calculate weight
    feedbackData.weight = CommunicationFeedback.calculateWeight(feedbackData);
    
    // Upsert to allow changing feedback
    const feedback = await CommunicationFeedback.findOneAndUpdate(
      { fromUser: fromUserId, aboutUser: aboutUserId, matchId },
      feedbackData,
      { upsert: true, new: true }
    );
    
    // Process feedback immediately to update user's score
    await processUserFeedback(aboutUserId);
    
    // Get updated score
    const updatedUser = await User.findById(aboutUserId).select('communicationScore');
    
    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: feedback._id,
        updatedScore: updatedUser?.communicationScore,
      },
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted feedback for this conversation',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    });
  }
};

/**
 * Process all feedback for a user and update their communication score
 */
const processUserFeedback = async (userId) => {
  try {
    // Get all unprocessed feedback for this user
    const allFeedback = await CommunicationFeedback.find({ aboutUser: userId });
    
    if (allFeedback.length === 0) {
      // No feedback yet, keep default score
      return;
    }
    
    // Calculate feedback breakdown
    const feedbackBreakdown = {
      responsive: 0,
      friendly: 0,
      genuine: 0,
      slowToReply: 0,
      unresponsive: 0,
      suspicious: 0,
      inappropriate: 0,
    };
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const fb of allFeedback) {
      // Update breakdown
      const breakdownKey = fb.feedbackType.replace('_', '').replace('slow_to_reply', 'slowToReply');
      const normalizedKey = fb.feedbackType === 'slow_to_reply' ? 'slowToReply' : fb.feedbackType;
      if (feedbackBreakdown.hasOwnProperty(normalizedKey)) {
        feedbackBreakdown[normalizedKey]++;
      }
      
      // Calculate weighted score contribution
      const scoreImpact = FEEDBACK_WEIGHTS[fb.feedbackType] || 0;
      totalWeightedScore += scoreImpact * fb.weight;
      totalWeight += fb.weight;
      
      // Mark as processed
      if (!fb.processed) {
        fb.processed = true;
        await fb.save();
      }
    }
    
    // Calculate new score (base 50, adjusted by weighted feedback)
    let newScore = 50;
    if (totalWeight > 0) {
      newScore = 50 + (totalWeightedScore / totalWeight) * 5;
    }
    
    // Clamp to 0-100
    newScore = Math.max(0, Math.min(100, Math.round(newScore)));
    
    // Calculate level
    const level = calculateLevel(newScore, feedbackBreakdown);
    
    // Update user
    await User.findByIdAndUpdate(userId, {
      $set: {
        'communicationScore.score': newScore,
        'communicationScore.level': level,
        'communicationScore.totalFeedback': allFeedback.length,
        'communicationScore.feedbackBreakdown': feedbackBreakdown,
        'communicationScore.lastUpdated': new Date(),
      },
    });
    
    return { score: newScore, level, totalFeedback: allFeedback.length };
  } catch (error) {
    console.error('Process user feedback error:', error);
    throw error;
  }
};

/**
 * Get a user's communication score
 * GET /api/communication/score/:userId
 */
const getCommunicationScore = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('communicationScore firstName');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        firstName: user.firstName,
        communicationScore: user.communicationScore || {
          level: 'new',
          score: 50,
          totalFeedback: 0,
        },
      },
    });
  } catch (error) {
    console.error('Get communication score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get communication score',
    });
  }
};

/**
 * Get feedback you've given (for editing)
 * GET /api/communication/my-feedback/:matchId
 */
const getMyFeedback = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { matchId } = req.params;
    
    const feedback = await CommunicationFeedback.findOne({
      fromUser: fromUserId,
      matchId,
    });
    
    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
    });
  }
};

/**
 * Check if user should be prompted for feedback
 * GET /api/communication/should-prompt/:matchId
 */
const shouldPromptFeedback = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { matchId } = req.params;
    
    // Check if feedback already given
    const existingFeedback = await CommunicationFeedback.findOne({
      fromUser: fromUserId,
      matchId,
    });
    
    if (existingFeedback) {
      return res.status(200).json({
        success: true,
        shouldPrompt: false,
        reason: 'already_submitted',
      });
    }
    
    // Check match age - only prompt after 3+ days
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(200).json({
        success: true,
        shouldPrompt: false,
        reason: 'match_not_found',
      });
    }
    
    const daysSinceMatch = Math.floor(
      (Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceMatch < 3) {
      return res.status(200).json({
        success: true,
        shouldPrompt: false,
        reason: 'too_soon',
        daysRemaining: 3 - daysSinceMatch,
      });
    }
    
    res.status(200).json({
      success: true,
      shouldPrompt: true,
      daysSinceMatch,
    });
  } catch (error) {
    console.error('Should prompt feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feedback status',
    });
  }
};

module.exports = {
  submitFeedback,
  getCommunicationScore,
  getMyFeedback,
  shouldPromptFeedback,
  processUserFeedback, // Export for potential use elsewhere
};
