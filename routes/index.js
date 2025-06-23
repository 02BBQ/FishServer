const express = require('express');
const router = express.Router();
const fishRoutes = require('./fishRoutes');
const datastoreRoutes = require('./datastoreRoutes');
const storeRoutes = require('./storeRoute');
const steamAuthController = require('../controllers/steamAuthController');

// 라우트 등록
router.use('/fish', fishRoutes);
router.use('/datastore', datastoreRoutes);
router.use('/store', storeRoutes);

// 스팀 인증 라우트
router.post('/auth/steam', steamAuthController.authenticateWithSteam);

module.exports = router; 