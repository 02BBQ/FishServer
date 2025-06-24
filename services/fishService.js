const { getDatabase, ref, set, get } = require("firebase/database");
const { admin, db } = require('../config/firebaseConfig');
const fishDataService = require('./fishDataService');
const utilService = require('./utilService');

// 물고기 신호 저장소
let fishSignals = {};

let baitMap;
let rarityData = [];

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

exports.loadBaitMap = async () =>
{
    const response = await fetch('https://script.google.com/macros/s/AKfycbz5u3jxyerqkbUFPqY8F7SMa9TR25Huay1iHBf_tcURUKsFcXAr6YnO0gq_OeOF-txI/exec?api=bait');
    baitMap = await response.json();
    console.log(baitMap);
}

/**
 * 낚시 시작
 */
exports.startFishing = async (userId, baitGuid) => {
    // 미끼 multiplier 기본값
    let baitMultiplier = 1.0;
    let baitData = null;

    if (baitGuid) {
        // 인벤토리에서 미끼 정보 조회
        const baitRef = ref(db, `users/${userId}/inventory/FishingBait/${baitGuid}`);
        const baitSnap = await get(baitRef);
        if (baitSnap.exists()) {
            baitData = baitSnap.val();
            baitMultiplier = baitMap[baitData.Id.toString()] || 0.1; // 최소값
            console.log(baitMultiplier);
        } else {
            // 미끼가 없으면 multiplier 1.0
            baitMultiplier = 0.0;
        }
    }

    const guid = utilService.generateRandomString(12);
    const randomDuration = getRandomFloat(5, 20) * 1000;
    const timestamp = Number(new Date()) + randomDuration;

    // 레어리티 결정 시 미끼 효과 적용
    const rarityData = fishDataService.getRarityData();
    let selectedRarity = null;
    const adjustedRarityData = rarityData.map(rarity => ({
        ...rarity,
        weight: calculateAdjustedWeight(rarity.weight, baitMultiplier, rarity.weight)
    }));

    // 조정된 가중치로 레어리티 선택
    const totalWeight = adjustedRarityData.reduce((sum, rarity) => sum + rarity.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const rarity of adjustedRarityData) {
        random -= rarity.weight;
        if (random <= 0) {
            selectedRarity = rarity.rarity;
            break;
        }
    }

    if (!selectedRarity) {
        selectedRarity = adjustedRarityData[0].rarity; // 기본값
    }

    const fishPool = fishDataService.getRarityTable()[selectedRarity];
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
            baitGuid: baitGuid || null,
            baitMultiplier: baitMultiplier,
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
exports.endFishing = async (userId, guid, baitGuid, suc) => {
    try {
        // 1. 초기 유효성 검사
        if (!fishSignals[guid] || !fishSignals[guid].isValid) {
            return { suc: false, err: "Fish not found." };
        }

        // 3. 데이터 추출 및 정리
        const fishData = fishSignals[guid];
        clearTimeout(fishData.timeoutCon);
        delete fishSignals[guid];
        
        // 2. 신호 무효화
        fishSignals[guid].isValid = false;
        
        if (!suc) {
            if (fishData.data.baitGuid) {
                await set(ref(db, `users/${userId}/inventory/FishingBait/${fishData.data.baitGuid}`), null);
            }
            return { suc: false };
        }


        // 4. Firebase 저장
        const cleanData = JSON.parse(JSON.stringify(fishData.data.fish)); // undefined 제거
        await set(ref(db, `users/${userId}/inventory/Fish/${fishData.data.guid}`), cleanData, { merge: true });

        // 5. 미끼 삭제
        if (fishData.data.baitGuid) {
            await set(ref(db, `users/${userId}/inventory/FishingBait/${fishData.data.baitGuid}`), null);
        }

        return { suc: true, fish: fishData.data.fish };
    } catch (error) {
        console.error("Error in endFishing():", error);
        return { suc: false, err: "Database error" };
    }
};

/**
 * 활성화된 물고기 신호 조회
 */
exports.getFish = () => fishSignals;

const getRandomRarity = () => {
    if (!exports.isTableValid(rarityData)) {
        throw new Error('Invalid rarityTable: The table is either empty or not an array.');
    }

    // 누적 확률 계산
    const totalWeight = rarityData.reduce((sum, rarity) => sum + rarity.weight, 0);
    const ranges = [];
    let cumulative = 0;

    for (const rarity of rarityData) {
        cumulative += rarity.weight / totalWeight;
        ranges.push({ rarity: rarity.rarity, range: cumulative });
    }

    // 난수 생성 및 희귀도 선택
    const random = Math.random();
    for (const range of ranges) {
        if (random <= range.range) {
            return range.rarity;
        }
    }

    return null; // 기본적으로 null 반환 (예외 처리)
};

/**
 * 미끼 효과를 적용한 레어리티 웨이트 계산
 */
const calculateAdjustedWeight = (originalWeight, baitMultiplier, rarityWeight) => {
    if (!baitMultiplier) return originalWeight;
    return originalWeight * (1 + Math.pow(baitMultiplier, rarityWeight));
}; 