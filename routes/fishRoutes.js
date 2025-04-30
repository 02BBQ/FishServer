const express = require('express');
const router = express.Router();
const fishController = require('../controllers/fishController');

// 물고기 관련 라우트
router.post('/start', fishController.startFishing);
router.post('/end', fishController.endFishing);

module.exports = router; 