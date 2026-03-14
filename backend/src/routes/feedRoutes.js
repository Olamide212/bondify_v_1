const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/auth');
const upload     = require('../middleware/upload');
const {
  getFeed,
  createPost,
  getPost,
  deletePost,
  toggleLike,
  toggleSave,
  addComment,
  deleteComment,
  toggleCommentLike,
  toggleFollow,
  getSavedPosts,
  getUserPosts,
  updateSocialProfile,
  uploadSocialPhoto,
} = require('../controllers/feedController');

router.use(protect);

// ── Feed ──────────────────────────────────────────────────────────────────────
router.get('/',                          getFeed);
router.post('/',                         createPost);
router.get('/saved',                     getSavedPosts);
router.patch('/social-profile',                        updateSocialProfile);
router.post('/social-profile/photo', upload.single('profilePhoto'), uploadSocialPhoto);
router.get('/profile/:userId',           getUserPosts);
router.get('/:postId',                   getPost);
router.delete('/:postId',                deletePost);
router.post('/:postId/like',             toggleLike);
router.post('/:postId/save',             toggleSave);
router.post('/:postId/comments',         addComment);
router.delete('/:postId/comments/:commentId', deleteComment);
router.post('/:postId/comments/:commentId/like', toggleCommentLike);
router.post('/follow/:userId',           toggleFollow);

module.exports = router;
