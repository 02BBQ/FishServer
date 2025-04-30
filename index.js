// index.js
const express = require('express');
const cors = require('cors');
const fishDataService = require('./services/fishDataService');
const routes = require('./routes');

const app = express();
const PORT = 3000;

// 게임 데이터 초기 로드
fishDataService.loadSheet();

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
    console.log(`Server is running on http://localhost:${PORT}`);
});
