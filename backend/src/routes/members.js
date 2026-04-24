const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { listMembers, getMember, getMemberScans } = require('../controllers/membersController');

// GET /api/members — public: coaches use this in MemberGPT (no auth per spec)
router.get('/', listMembers);

// GET /api/members/:id — requires auth: members may only view their own profile
router.get('/:id', requireAuth, getMember);

// GET /api/members/:id/scans — requires auth: members may only view their own scans
router.get('/:id/scans', requireAuth, getMemberScans);

module.exports = router;