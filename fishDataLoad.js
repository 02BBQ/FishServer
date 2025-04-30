let fishTable = [];
let rarityTable = {};
let traitTable = [];

let rarityData = [];


const groupFishByRarity = (fishList) => {
    const grouped = {};

    for (const fish of fishList) {
        const rarity = fish.rarity;
        if (!grouped[rarity]) {
            grouped[rarity] = [];
        }
        grouped[rarity].push(fish);
    }

    return grouped
};



exports.loadSheet = async() => {
    console.log('Loading fish data...');
    const result = await fetch('https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLivTF4Pk_gqpFP31mrQ0wwsRgy2hmHG2SbFedQ3wLvOXivoCk1XMs7SxXrjBMe60-MwgSdjWCxleeTxjweLglQn1Ds5IatvMuWFN233jh0wEcCRS_tGb4W1rcAol2t4huNeGcvaq_3GEW0oDMWNPUlQ6ifWzFlFI6CE-l9_FB2TCHcFnQ85Icgdts_HKTe7fFGZUSnjQibIQBaSiJvhSmMt16nFkhIw3PmL0OlrXQJ2gWtXUKyTqjaqMQk5-pZDcIrxX4X-vqQl_PhLV1Xrjb5Noexrxw&lib=MwCv8SFRzZRP1P71XYDnI8A_aaQm-UuqJ');
    const data = await result.json();

    console.log(data);
    fishTable = data[0];
    rarityData = data[1];
    exports.traitTable = data[2];

    rarityTable = groupFishByRarity(fishTable);
    console.log(data[2]);
}

exports.getRarityTable = () => {
    // if (rarityTable ===  || rarityTable.length === 0) {
    return rarityTable;
}

exports.getRandomRarity = () => {
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

exports.fishTable = fishTable;
exports.traitTable = traitTable;
exports.rarityTable = rarityTable;

exports.isTableValid = (table) => {
    return table && Array.isArray(table) && table.length > 0;
}