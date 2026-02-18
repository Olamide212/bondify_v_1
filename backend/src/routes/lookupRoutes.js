const express = require('express');
const router = express.Router();
const {
  getLookups,
  getAllLookupTypes,
} = require('../controllers/lookupController');

router.get('/', getLookups);
router.get('/types', getAllLookupTypes);

module.exports = router;
