const express = require('express');
const router = express.Router();
const fishRoutes = require('./fishRoutes');
const datastoreRoutes = require('./datastoreRoutes');
const storeRoutes = require('./storeRoute');

// 라우트 등록
router.use('/fish', fishRoutes);
router.use('/datastore', datastoreRoutes);
router.use('/store', storeRoutes);

module.exports = router; 