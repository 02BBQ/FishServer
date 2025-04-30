const express = require('express');
const router = express.Router();
const datastoreController = require('../controllers/datastoreController');

// 데이터스토어 관련 라우트
router.post('/initload', datastoreController.initLoad);
router.post('/fishtank', datastoreController.getInventoryData);

module.exports = router; 