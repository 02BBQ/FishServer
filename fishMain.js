const { rarityTable, getRandomRarity, traitTable, getRarityTable } = require('./fishDataLoad');
const fishData = require('./fishDataLoad');
const util = require('./util');

let fishSignals = {};

const getRandomFloat = (min, max) => {
    return min + Math.random() * (max - min);
};

exports.start = () => {
    const guid = util.generateRandomString(8); // Generate a random string of length 16
    const randomDuration = getRandomFloat(20, 76) * 1000;
    const timestamp = Number(new Date()) + randomDuration;

    const fishPool = getRarityTable()[getRandomRarity()];

    const fish = fishPool[Math.random() * fishPool.length | 0];

    const weight = getRandomFloat(fish.minWeightMultiplier, fish.maxWeightMultiplier);

    console.log(fishData.traitTable);

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
                dancingStep: getRandomFloat(fish.dancingStepMin, fish.dancingStepMax),
            },
        },
        timestamp: timestamp,
        timeout: randomDuration,
        timeoutCon: setTimeout(() => {
            delete fishSignals[guid];
            console.log(`${guid} has been removed from fishSignals.`);
        }, randomDuration),
    };

    return fishSignals[guid]["data"];
};

exports.end = (guid, suc) => {
    if (fishSignals[guid]) {
        clearTimeout(fishSignals[guid].timeoutCon);
        let fishData = fishSignals[guid];
        delete fishSignals[guid];
        return fishData;
    }
    return false;
}

exports.getFish = fishSignals;