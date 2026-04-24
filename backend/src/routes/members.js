const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { listMembers, getMember, getMemberScans } = require('../controllers/membersController');

// All member routes require auth
router.use(requireAuth);

// GET /api/members — list all members (coaches use this in MemberGPT)
router.get('/', listMembers);

// GET /api/members/:id — get single member profile
router.get('/:id', getMember);

// GET /api/members/:id/scans — all scans for a member (sorted by date desc)
router.get('/:id/scans', getMemberScans);

module.exports = router;
