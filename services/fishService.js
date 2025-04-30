const { getDatabase, ref, set, get } = require("firebase/database");
const { admin, db } = require('../config/firebaseConfig');
const fishDataService = require('./fishDataService');
const utilService = require('./utilService');

// 물고기 신호 저장소
let fishSignals = {};

/**
 * 랜덤 실수 생성
 */
const getRandomFloat = (min, max) => {
    return min + Math.random() * (max - min);
};

/**
 * 네제곱 가중치 랜덤 값 생성
 */
function quarticRandom() {
    // 1. 0~0.9999 범위에서 2.5제곱 가중치 적용
    const weighted = Math.pow(Math.random(), 2.5);
    
    // 2. 소수점 둘째자리까지 반올림 (0.00 ~ 1.00)
    const rounded = Math.round(weighted * 1000) / 1000;
    
    // 3. 1% 확률로 강제 1.00 반환
    return Math.random() < 0.01 ? 100 : rounded*100;
}

/**
 * 낚시 시작
 */
exports.start = () => {
    const guid = utilService.generateRandomString(12);
    const randomDuration = getRandomFloat(5, 20) * 1000;
    const timestamp = Number(new Date()) + randomDuration;

    const fishPool = fishDataService.getRarityTable()[fishDataService.getRandomRarity()];
    const fish = fishPool[Math.random() * fishPool.length | 0];
    const weight = getRandomFloat(fish.minWeightMultiplier, fish.maxWeightMultiplier);

    fishSignals[guid] = {
        data : {
            guid: guid,
            fish: {
                name: fish.spec,
                spec: fish.koreanName,
                rarity: fish.rarity,
                trait: Math.random() < 0.1 ? fishDataService.traitTable[Math.floor(Math.random() * fishDataService.traitTable.length)] : null,
                visualAddress: fish.visualAddress,
                id: fish.id,
                description: fish.description,
                weight: weight,
                price: (fish.basePrice * weight).toFixed(3),
                type: "Fish",
            },
        },
        dancingStep: getRandomFloat(fish.dancingStepMin, fish.dancingStepMax),
        isValid : true,
        timestamp: timestamp,
        timeout: randomDuration,
        timeoutCon: setTimeout(() => {
            delete fishSignals[guid];
            console.log(`${guid} has been removed from fishSignals.`);
        }, randomDuration + 15000),
    };

    let tempFish = fishSignals[guid]['data']['fish'];

    tempFish['weight'] = tempFish['weight'].toFixed(2);
    if (tempFish['trait'] !== null && tempFish['trait'] !== undefined)
    {
        tempFish['purity'] = quarticRandom();
    }


    return {
        guid: guid, 
        time: fishSignals[guid]['timeout'], 
        dancingStep: fishSignals[guid]['dancingStep']
    };
};

/**
 * 낚시 종료
 */
exports.end = async (guid, suc) => {
    try {
        // 1. 초기 유효성 검사
        if (!fishSignals[guid] || !fishSignals[guid].isValid) {
            return { suc: false, err: "Fish not found." };
        }

        // 2. 신호 무효화
        fishSignals[guid].isValid = false;
        
        if (!suc) {
            return { suc: false };
        }

        // 3. 데이터 추출 및 정리
        const fishData = fishSignals[guid];
        clearTimeout(fishData.timeoutCon);
        delete fishSignals[guid];

        // 4. Firebase 저장
        const cleanData = JSON.parse(JSON.stringify(fishData.data.fish)); // undefined 제거
        await set(ref(db, `users/test/inventory/${fishData.data.guid}`), cleanData, { merge: true });

        return { suc: true, fish: fishData.data.fish };
    } catch (error) {
        console.error("Error in end():", error);
        return { suc: false, err: "Database error" };
    }
};

/**
 * 활성화된 물고기 신호 조회
 */
exports.getFish = () => fishSignals; 