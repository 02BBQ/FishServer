const { getDatabase, ref, set, get } = require("firebase/database");
const { admin, db } = require('../config/firebaseConfig');

/**
 * 초기 데이터 로드
 */
exports.initLoad = async (userId) => {
    try {
        let money = 100;
        const snapshot = await get(ref(db, `inventory/${userId}/money`));
        {
            if (snapshot.exists())
                money = snapshot.val();
            else
                await set(ref(db, `inventory/${userId}/money`), money);
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
        const snapshot = await get(ref(db, `inventory/${userId}`));
        if (!snapshot.exists()) return { items: {} };
        
        const inventoryData = snapshot.val();
        const result = {};
        
        // 각 아이템 타입별 처리
        for (const guid in inventoryData) {
            const item = inventoryData[guid];
            const type = item.type || "none";
            
            // 해당 타입의 객체가 없으면 생성
            if (!result[type]) {
                result[type] = [];
            }
            
            // 아이템 데이터를 복사하고 guid 추가
            const itemWithGuid = { ...item, guid };
            
            // 아이템 데이터를 배열에 추가
            result[type].push(itemWithGuid);
        }
        
        return result;
    } catch (error) {
        console.error("Error getting inventory:", error);
        throw error;
    }
}; 