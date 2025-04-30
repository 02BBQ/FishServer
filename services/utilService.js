/**
 * 유틸리티 서비스
 * 공통으로 사용되는 유틸리티 함수들을 제공합니다.
 */

/**
 * 지정된 길이의 랜덤 문자열 생성
 */
exports.generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

/**
 * 지정된 범위 내의 랜덤 정수 생성
 */
exports.generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 구매 가능 여부 확인
 */
exports.canBuy = (money, price) => {
    return money >= price;
}; 