const { getDatabase, ref, set, get } = require("firebase/database");
const { admin, db } = require('../config/firebaseConfig');

/**
 * 초기 데이터 로드
 */
exports.initLoad = async (userId) => {
    try {
        let money = 100;
        const snapshot = await get(ref(db, `users/${userId}/money`));
        {
            if (snapshot.exists())
            {
                money = snapshot.val();
            }
            else
            {
                await set(ref(db, `users/${userId}/money`), money);
            }
        }
        
        const result = {
            money : money || 0,
            inventoryData : await this.getInventoryData(userId) || {},
        };

        return result;
    } catch (error) {
        console.error('Error in initLoad:', error);
        throw error;
    }
};

/**
 * 인벤토리 데이터 조회
 */
exports.getInventoryData = async (userId) => {
    try {
        const snapshot = await get(ref(db, `users/${userId}/inventory`));
        if (!snapshot.exists()) return { items: {} };

        const inventoryData = snapshot.val();
        const result = {};

        // 타입별로 반복 (예: FishingRod, ...)
        for (const type in inventoryData) {
            result[type] = [];
            for (const guid in inventoryData[type]) {
                const itemObj = inventoryData[type][guid];
                // itemObj가 { item, purchaseDate } 구조임
                result[type].push({
                    guid: guid,
                    ...itemObj,
                });
            }
        }

        return result;
    } catch (error) {
        console.error("Error getting inventory:", error);
        throw error;
    }
}; 