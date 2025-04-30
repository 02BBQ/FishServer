const express = require('express');
const router = express.Router();
const fishRoutes = require('./fishRoutes');
const datastoreRoutes = require('./datastoreRoutes');

// 라우트 등록
router.use('/fish', fishRoutes);
router.use('/datastore', datastoreRoutes);

module.exports = router; 