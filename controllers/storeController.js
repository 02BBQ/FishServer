const storeService = require('../services/storeService');

/**
 * 상점 아이템 목록 조회
 */
exports.getStoreItems = async (req, res) => {
    try {
        const items = await storeService.getStoreItems();
        res.json({ success: true, items });
    } catch (error) {
        console.error('상점 아이템 조회 실패:', error);
        res.status(500).json({ success: false, error: '서버 오류' });
    }
};

/**
 * 아이템 구매
 */
exports.buy = async (req, res) => {
    try {
        const { userId, itemName } = req.body;
        
        if (!userId || !itemName) {
            return res.status(400).json({ 
                success: false, 
                message: "사용자 ID와 아이템 이름이 필요합니다" 
            });
        }
        
        const result = await storeService.buy(userId, itemName);
        res.json(result);
    } catch (error) {
        console.error('구매 처리 실패:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
};


exports.sell = async (req, res) => {
    try {
        const { userId, guid } = req.body;
        
        if (!userId || !guid) {
            return res.status(400).json({ 
                success: false, 
                message: "사용자 ID와 아이템 ID가 필요합니다" 
            });
        }
        
        const result = await storeService.sell(userId, guid);
        res.json(result);
    } catch (error) {
        console.error('구매 처리 실패:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
};


