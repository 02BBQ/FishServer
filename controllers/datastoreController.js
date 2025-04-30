const datastoreService = require('../services/datastoreService');

/**
 * 초기 데이터 로드
 */
exports.initLoad = async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await datastoreService.initLoad(userId);
        res.json(result);
    } catch (error) {
        console.error('Error loading initial data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * 인벤토리 데이터 조회
 */
exports.getInventoryData = async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await datastoreService.getInventoryData(userId);
        res.json(result);
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 