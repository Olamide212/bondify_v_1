const User = require('../models/User');
const Notification = require('../models/Notification');

// Premium plan definitions
const PREMIUM_PLANS = {
  basic: {
    name: 'Basic',
    price: 9.99,
    duration: 30, // days
    features: {
      unlimitedLikes: false,
      seeWhoLikedYou: false,
      superLikes: 5,
      boosts: 1,
      rewind: true,
      incognitoMode: false,
      priorityMatching: false,
    },
  },
  gold: {
    name: 'Gold',
    price: 19.99,
    duration: 30,
    features: {
      unlimitedLikes: true,
      seeWhoLikedYou: true,
      superLikes: 10,
      boosts: 3,
      rewind: true,
      incognitoMode: false,
      priorityMatching: true,
    },
  },
  platinum: {
    name: 'Platinum',
    price: 29.99,
    duration: 30,
    features: {
      unlimitedLikes: true,
      seeWhoLikedYou: true,
      superLikes: 999,
      boosts: 10,
      rewind: true,
      incognitoMode: true,
      priorityMatching: true,
    },
  },
};

// ─────────────────────────────────────────────
//  GET PLANS
// ─────────────────────────────────────────────
const getPlans = async (req, res, next) => {
  try {
    res.json({ success: true, data: PREMIUM_PLANS });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  GET CURRENT SUBSCRIPTION STATUS
// ─────────────────────────────────────────────
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'isPremium premiumPlan premiumExpiresAt premiumFeatures'
    );

    const isExpired = user.premiumExpiresAt && user.premiumExpiresAt < new Date();

    if (isExpired && user.isPremium) {
      // Auto-downgrade expired subscriptions
      await User.findByIdAndUpdate(req.user._id, {
        isPremium: false,
        premiumPlan: null,
        premiumFeatures: {
          unlimitedLikes: false,
          seeWhoLikedYou: false,
          superLikes: 0,
          boosts: 0,
          rewind: false,
          incognitoMode: false,
          priorityMatching: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isPremium: user.isPremium && !isExpired,
        plan: isExpired ? null : user.premiumPlan,
        expiresAt: user.premiumExpiresAt,
        features: isExpired ? null : user.premiumFeatures,
        daysRemaining: user.premiumExpiresAt
          ? Math.max(0, Math.ceil((user.premiumExpiresAt - new Date()) / (1000 * 60 * 60 * 24)))
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  ACTIVATE PREMIUM
//  In production, integrate with Stripe/PayStack/RevenueCat
//  and call this endpoint after payment webhook confirms success.
// ─────────────────────────────────────────────
const activatePremium = async (req, res, next) => {
  try {
    const { plan, transactionId, paymentProvider } = req.body;

    if (!PREMIUM_PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'transactionId is required' });
    }

    // TODO: Verify transactionId with your payment provider (Stripe/PayStack)
    // e.g., await stripe.charges.retrieve(transactionId)

    const planConfig = PREMIUM_PLANS[plan];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planConfig.duration);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumPlan: plan,
        premiumExpiresAt: expiresAt,
        premiumFeatures: planConfig.features,
      },
      { new: true }
    ).select('isPremium premiumPlan premiumExpiresAt premiumFeatures');

    // Create in-app notification
    await Notification.create({
      recipient: req.user._id,
      type: 'system',
      title: `🎉 Welcome to ${planConfig.name}!`,
      body: `Your ${planConfig.name} subscription is now active. Enjoy your premium features!`,
      data: { plan, expiresAt },
    });

    res.json({
      success: true,
      message: `${planConfig.name} subscription activated!`,
      data: {
        plan: user.premiumPlan,
        expiresAt: user.premiumExpiresAt,
        features: user.premiumFeatures,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  CANCEL PREMIUM (sets to expire at end of period)
// ─────────────────────────────────────────────
const cancelPremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('isPremium premiumExpiresAt premiumPlan');

    if (!user.isPremium) {
      return res.status(400).json({ success: false, message: 'No active subscription' });
    }

    // In production: cancel the subscription with the payment provider
    // The user keeps access until premiumExpiresAt

    res.json({
      success: true,
      message: `Subscription cancelled. You will retain access until ${user.premiumExpiresAt?.toDateString()}.`,
      data: { expiresAt: user.premiumExpiresAt },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlans, getSubscriptionStatus, activatePremium, cancelPremium };
