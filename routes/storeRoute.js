const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// 상점 관련 라우트
router.get('/items', storeController.getStoreItems);
router.post('/buy', storeController.buy);
router.post('/sell', storeController.sell);

module.exports = router; 