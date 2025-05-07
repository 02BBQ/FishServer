// index.js
const express = require('express');
const cors = require('cors');
const fishDataService = require('./services/fishDataService');
const storeService = require('./services/storeService');
const routes = require('./routes');

const app = express();
const PORT = 3000;

// 게임 데이터 초기 로드
async function loadGameData() {
    try {
        await fishDataService.loadSheet();
        await storeService.loadStoreItems();
        console.log('모든 게임 데이터 로드 완료');
    } catch (error) {
        console.error('게임 데이터 로드 중 오류 발생:', error);
    }
}

// 데이터 로드 실행
loadGameData();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 설정
app.use('/api', routes);

// 기본 경로
app.get('/', (req, res) => {
    res.send('Fish Server API');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
