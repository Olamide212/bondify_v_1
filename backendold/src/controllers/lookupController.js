const Lookup = require('../models/Lookup');

// @desc    Get lookup data
// @route   GET /api/lookup
// @access  Public
const getLookups = async (req, res, next) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type parameter is required',
      });
    }

    const lookups = await Lookup.find({
      type,
      isActive: true,
    }).sort({ order: 1, label: 1 });

    res.json({
      success: true,
      data: { lookups },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all lookup types
// @route   GET /api/lookup/types
// @access  Public
const getAllLookupTypes = async (req, res, next) => {
  try {
    const types = await Lookup.distinct('type');

    const lookupsByType = {};

    for (const type of types) {
      const lookups = await Lookup.find({
        type,
        isActive: true,
      }).sort({ order: 1, label: 1 });

      lookupsByType[type] = lookups;
    }

    res.json({
      success: true,
      data: lookupsByType,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLookups,
  getAllLookupTypes,
};
