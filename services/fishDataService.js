/**
 * 물고기 데이터 서비스
 * 물고기 정보와 희귀도, 특성 등의 정보를 관리합니다.
 */

// 데이터 저장소
let fishTable = [];
let rarityTable = {};
let traitTable = [];
let rarityData = [];

/**
 * 희귀도별로 물고기를 그룹화
 */
const groupFishByRarity = (fishList) => {
    const grouped = {};

    for (const fish of fishList) {
        const rarity = fish.rarity;
        if (!grouped[rarity]) {
            grouped[rarity] = [];
        }
        grouped[rarity].push(fish);
    }

    return grouped;
};

/**
 * 구글 스프레드시트에서 물고기 데이터 로드
 */
exports.loadSheet = async () => {
    console.log('Loading fish data...');
    try {
        const result = await fetch('https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLivTF4Pk_gqpFP31mrQ0wwsRgy2hmHG2SbFedQ3wLvOXivoCk1XMs7SxXrjBMe60-MwgSdjWCxleeTxjweLglQn1Ds5IatvMuWFN233jh0wEcCRS_tGb4W1rcAol2t4huNeGcvaq_3GEW0oDMWNPUlQ6ifWzFlFI6CE-l9_FB2TCHcFnQ85Icgdts_HKTe7fFGZUSnjQibIQBaSiJvhSmMt16nFkhIw3PmL0OlrXQJ2gWtXUKyTqjaqMQk5-pZDcIrxX4X-vqQl_PhLV1Xrjb5Noexrxw&lib=MwCv8SFRzZRP1P71XYDnI8A_aaQm-UuqJ');
        const data = await result.json();

        // fishTable, baitTable 분리해서 관리
        fishTable = data[0];
        rarityData = data[1];
        traitTable = data[2];

        // // baitTable도 fishTable에 합치기 (address, baitMultiplier 등 포함)
        // for (const bait of baitTable) {
        //     fishTable.push({
        //         ...bait,
        //         type: 'Bait',
        //         address: bait.address,
        //         baitMultiplier: bait.baitMultiplier
        //     });
        // }

        rarityTable = groupFishByRarity(fishTable);
        console.log('Fish & Bait data loaded successfully');
    } catch (error) {
        console.error('Error loading fish data:', error);
        throw error;
    }
};

/**
 * 희귀도 테이블 반환
 */
exports.getRarityTable = () => {
    return rarityTable;
};

exports.getRarityData = () => {
    return rarityData;
};

/**
 * 무작위 희귀도 선택
 */
exports.getRandomRarity = () => {
    if (!this.isTableValid(rarityData)) {
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
 * 데이터 테이블 유효성 검사
 */
exports.isTableValid = (table) => {
    return table && Array.isArray(table) && table.length > 0;
};

// 외부 접근용 속성
exports.fishTable = fishTable;
exports.traitTable = traitTable;
exports.rarityTable = rarityTable;
exports.rarityData = rarityData; 