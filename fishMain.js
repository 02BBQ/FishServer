const { rarityTable, getRandomRarity, traitTable, getRarityTable } = require('./fishDataLoad');
const fishData = require('./fishDataLoad');
const util = require('./util');

let fishSignals = {};

const getRandomFloat = (min, max) => {
    return min + Math.random() * (max - min);
};

function quarticRandom() {
    // 1. 0~0.9999 범위에서 4제곱 가중치 적용
    const weighted = Math.pow(Math.random(), 2.5);
    
    // 2. 소수점 둘째자리까지 반올림 (0.00 ~ 1.00)
    const rounded = Math.round(weighted * 1000) / 1000;
    
    // 3. 1% 확률로 강제 1.00 반환
    return Math.random() < 0.01 ? 100 : rounded*100;
}

exports.start = () => {
    const guid = util.generateRandomString(12); // Generate a random string of length 16
    const randomDuration = getRandomFloat(5, 20) * 1000;
    const timestamp = Number(new Date()) + randomDuration;

    const fishPool = getRarityTable()[getRandomRarity()];

    const fish = fishPool[Math.random() * fishPool.length | 0];

    const weight = getRandomFloat(fish.minWeightMultiplier, fish.maxWeightMultiplier);

    fishSignals[guid] = {
        data : {
            guid: guid,
            fish: {
                name: fish.spec,
                spec: fish.koreanName,
                rarity: fish.rarity,
                trait: Math.random() < 0.1 ? fishData.traitTable[Math.floor(Math.random() * fishData.traitTable.length)] : null,
                visualAddress: fish.visualAddress,
                id: fish.id,
                description: fish.description,
                weight: weight,
                price: fish.basePrice * weight,
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

    fishSignals[guid]['data']['fish']['weight'] = fishSignals[guid]['data']['fish']['weight'].toFixed(2);
    if (fishSignals[guid]['data']['fish']['trait'] !== null && fishSignals[guid]['data']['fish']['trait'] !== undefined)
    {
        fishSignals[guid]['data']['fish']['purity'] = quarticRandom();
    }

    

    return {guid: guid, time: fishSignals[guid]['timeout'], dancingStep: fishSignals[guid]['dancingStep']};
};

exports.end = (guid, suc) => {
    fishSignals[guid].isValid = false;
    if (!suc || fishSignals[guid] == null) 
    {
        return {
            suc : false,
        }
    }    
    if (fishSignals[guid]) {
        if (fishSignals[guid].isValid == false) return;
        clearTimeout(fishSignals[guid].timeoutCon);
        delete fishSignals[guid].timeoutCon;
        fishSignals[guid].timeoutCon = undefined;
        let fishData = fishSignals[guid];
        delete fishSignals[guid];
        fishData.data.suc = true;
        return fishData.data;
    }

    return null;
}

exports.getFish = fishSignals;