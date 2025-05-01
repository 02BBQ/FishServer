const express = require('express');
const router = express.Router();

// 상점 관련 라우트
router.post('/store-buy', fishController.startFishing);

module.exports = router; 