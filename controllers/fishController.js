const fishService = require('../services/fishService');

/**
 * 낚시 시작
 */
exports.startFishing = async (req, res) => {
    try {
        const { userId, baitGuid } = req.body;
        const result = await fishService.startFishing(userId, baitGuid);
        res.json(result);
    } catch (error) {
        console.error('낚시 시작 에러:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 낚시 종료
 */
exports.endFishing = async (req, res) => {
    try {
        const { userId, guid, baitGuid, suc } = req.body;
        const result = await fishService.endFishing(userId, guid, baitGuid, suc);
        res.json(result);
    } catch (error) {
        console.error('낚시 종료 에러:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 활성화된 물고기 시그널 조회
 */
exports.getActiveFishSignals = async (req, res) => {
    try {
        const signals = await fishService.getActiveFishSignals();
        res.json(signals);
    } catch (error) {
        console.error('물고기 시그널 조회 에러:', error);
        res.status(500).json({ error: error.message });
    }
}; 