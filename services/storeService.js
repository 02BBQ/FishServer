const { update, ref, set, get } = require("firebase/database");
const { admin, db } = require('../config/firebaseConfig');
const fishDataService = require('./fishDataService');
const utilService = require('./utilService');

// 상점 아이템 테이블
let storeItemTable = {};

// 유니티 아이템 타입과 DB 아이템 타입 간의 매핑
const itemTypeMapping = {
    'fish': 'fishes',
    'fishingRod': 'rods',
    'boat': 'boats',
    'bait': 'baits',
    // 필요한 매핑을 추가
};

// DB 아이템 타입을 유니티 아이템 타입으로 변환
exports.dbToUnityType = (dbType) => {
    const mapping = Object.entries(itemTypeMapping).find(([unityType, dbTypeValue]) => dbTypeValue === dbType);
    return mapping ? mapping[0] : dbType; // 매핑이 없으면 원래 타입 반환
};

// 유니티 아이템 타입을 DB 아이템 타입으로 변환
exports.unityToDbType = (unityType) => {
    return itemTypeMapping[unityType] || unityType; // 매핑이 없으면 원래 타입 반환
};

// 상점 데이터 로드
exports.loadStoreItems = async() => {
    console.log('상점 데이터 로드 중...');
    try {
        const result = await fetch('https://script.googleusercontent.com/macros/echo?user_content_key=YOUR_SHEET_KEY');
        const data = await result.json();
        
        storeItemTable = data;
        console.log('상점 데이터 로드 완료:', Object.keys(storeItemTable).length, '개 아이템');
        return storeItemTable;
    } catch (error) {
        console.error('상점 데이터 로드 실패:', error);
        throw error;
    }
};

// 상점 아이템 목록 가져오기
exports.getStoreItems = async () => {
    try {
        // 상점 아이템이 로드되지 않았으면 로드
        if (Object.keys(storeItemTable).length === 0) {
            await this.loadStoreItems();
        }
        
        return Object.values(storeItemTable);
    } catch (error) {
        console.error('상점 아이템 조회 실패:', error);
        throw error;
    }
};

// 아이템 구매
exports.buy = async (userId, itemId) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            console.error("User not found");
            return { success: false, message: "User not found" };
        }

        const userData = userSnapshot.val();
        const money = userData.money || 0;

        const item = storeItemTable[itemId];

        if (!item) {
            console.error("Invalid item ID");
            return { success: false, message: "Invalid item ID" };
        }
        
        if (money < item.price) {
            console.error("Not enough money");
            return { success: false, message: "Not enough money" };
        }

        const newMoney = money - item.price;

        // 유니티 아이템 타입을 DB 타입으로 변환
        const dbItemType = this.unityToDbType(item.type);
        
        // 고유 ID 생성 (타임스탬프 + 랜덤 문자열)
        const itemGuid = Date.now() + '_' + utilService.generateRandomString(8);
        
        // 트랜잭션 시작 (여러 업데이트를 한번에 처리)
        const updates = {};
        
        // 돈 업데이트
        updates[`users/${userId}/money`] = newMoney;
        
        // 인벤토리에 아이템 추가
        updates[`users/${userId}/inventory/${dbItemType}/${itemGuid}`] = {
            id: itemId,
            purchaseDate: Date.now(),
            // 추가 속성이 필요하면 여기에 추가
        };
        
        // 트랜잭션 실행 (한번에 여러 업데이트)
        await update(ref(db), updates);

        console.log(`아이템 ${itemId} 구매 성공!`);
        return { 
            success: true, 
            message: "Item purchased successfully",
            item: { 
                id: itemId, 
                guid: itemGuid,
                type: item.type,
                name: item.name,
                // 필요한 추가 정보
            }
        };
    } catch (error) {
        console.error("구매 처리 오류:", error);
        return { success: false, message: "Internal server error" };
    }
};