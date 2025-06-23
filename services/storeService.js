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
        const response = await fetch('https://script.google.com/macros/s/AKfycbz5u3jxyerqkbUFPqY8F7SMa9TR25Huay1iHBf_tcURUKsFcXAr6YnO0gq_OeOF-txI/exec?api=store');
        const data = await response.json();

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
exports.buy = async (userId, itemName) => {
    try {
        let item = Object.values(storeItemTable).find(t => t.Name === itemName);
        
        if (!item) {
            console.error("Item not found");
            return { success: false, message: "Item not found" };
        }
        let itemId = item.Id; 

        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            console.error("User not found");
            return { success: false, message: "User not found" };
        }

        const userData = userSnapshot.val();
        const money = userData.money || 0;

        if (!item) {
            console.error("Invalid item ID");
            return { success: false, message: "Invalid item ID" };
        }
        
        // 이미 아이템을 가지고 있는지 체크
        const dbItemType = this.unityToDbType(item.Category);
        const inventoryRef = ref(db, `users/${userId}/inventory/${dbItemType}`);
        const inventorySnapshot = await get(inventoryRef);
        
        if (inventorySnapshot.exists()) {
            const inventory = inventorySnapshot.val();
            // 같은 종류의 아이템이 이미 있는지 확인
            const hasItem = Object.values(inventory).some(existingItem => 
                existingItem.Id === item.Id
            );
            
            if (hasItem) {
                console.error("Already owns this item");
                return { success: false, message: "이미 소지하고 있는 아이템입니다." };
            }
        }

        if (money < item.Price) {
            console.error("Not enough money");
            return { success: false, message: "Not enough money" };
        }

        const newMoney = money - item.Price;
        
        // 고유 ID 생성 (타임스탬프 + 랜덤 문자열)
        const itemGuid = Date.now() + '_' + utilService.generateRandomString(8);
        item.Guid = itemGuid; // 아이템에 GUID 추가
        
        // 트랜잭션 시작 (여러 업데이트를 한번에 처리)
        const updates = {};
        
        // 돈 업데이트
        updates[`users/${userId}/money`] = newMoney;
        
        // 인벤토리에 아이템 추가
        updates[`users/${userId}/inventory/${dbItemType}/${itemGuid}`] = {
            purchaseDate: Date.now(),
            ...item,
        };
        
        // 트랜잭션 실행 (한번에 여러 업데이트)
        await update(ref(db), updates);

        console.log(`아이템 ${itemId} 구매 성공!`);
        return { 
            success: true, 
            message: "Item purchased successfully",
            item: item,
            money: newMoney,
        };
    } catch (error) {
        console.error("구매 처리 오류:", error);
        return { success: false, message: "Internal server error" };
    }
};

// 아이템 구매
exports.sell = async (userId, guid) => {
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);

        console.log(userId, guid);
        if (!userSnapshot.exists()) {
            console.error("User not found");
            return { success: false, message: "User not found" };
        }

        const userData = userSnapshot.val();
        const money = userData.money || 0;

        let item;

        for (const dbType in userData.inventory) {
            if (userData.inventory[dbType][guid]) {
                item = userData.inventory[dbType][guid];
                item.Category = this.dbToUnityType(dbType); // 유니티 타입으로 변환
                break;
            }
        }


        if (!item) {
            console.error("Invalid item ID");
            return { success: false, message: "Invalid item ID" };
        }

        const price = parseInt(item.Price) || parseInt(item.price) || 0;

        const newMoney = parseInt(money) + price;

        console.log(price, newMoney);
        
        // 트랜잭션 시작 (여러 업데이트를 한번에 처리)
        const updates = {};
        
        // 돈 업데이트
        updates[`users/${userId}/money`] = newMoney;

        updates[`users/${userId}/inventory/${this.unityToDbType(item.Category)}/${guid}`] = null; // 아이템 제거
        
        // 트랜잭션 실행 (한번에 여러 업데이트)
        await update(ref(db), updates);

        console.log(`아이템 ${item.Name} 판매 성공!`);
        return { 
            success: true, 
            message: `${item.Name} sold successfully`,
            item: item,
            money: newMoney,
        };
    } catch (error) {
        console.error("구매 처리 오류:", error);
        return { success: false, message: "Internal server error" };
    }
};