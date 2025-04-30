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
            if (snapshot.exists() && snapshot.result)
            {
                money = snapshot.val();
            }
            else
            {
                await set(ref(db, `users/${userId}/money`), money);
            }
        }
        
        const userData = snapshot.val();
        const result = {
            money : userData || 0,
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
        const snapshot = await get(ref(db, `users/${userId}`));
        if (!snapshot.exists()) return { items: {} };
        
        const userData = snapshot.val();
        const inventoryData = userData.inventory || {};
        const result = {};
        
        // 각 아이템 타입별 처리
        for (const guid in inventoryData) {
            const item = inventoryData[guid];
            const type = item;

            // 아이템 데이터를 복사하고 guid 추가
            const itemWithGuid = { ...item, guid };
            
            // 아이템 데이터를 배열에 추가
            esult[type].push(itemWithGuid);
        };
        
        return result;
    } catch (error) {
        console.error("Error getting inventory:", error);
        throw error;
    }
}; 