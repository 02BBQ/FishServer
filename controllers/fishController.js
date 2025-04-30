const fishService = require('../services/fishService');

/**
 * 낚시 시작 처리
 */
exports.startFishing = (req, res) => {
    try {
        const result = fishService.start();
        res.json(result);
    } catch (error) {
        console.error('Error starting fishing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * 낚시 종료 처리
 */
exports.endFishing = async (req, res) => {
    try {
        const { guid, suc } = req.body;
        const result = await fishService.end(guid, suc);
        res.json(result);
    } catch (error) {
        console.error('Error ending fishing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 