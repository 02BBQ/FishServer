// index.js
const express = require('express');
const cors = require('cors');
const fishDataService = require('./services/fishDataService');
const storeService = require('./services/storeService');
const routes = require('./routes');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fishService = require('./services/fishService');
const datastoreService = require('./services/datastoreService');

const app = express();
const PORT = 5926;
const GRPC_PORT = 50051;

//New-NetFirewallRule -DisplayName "Node.js 5926" -Direction Inbound -LocalPort 5926 -Protocol TCP -Action Allow
//Remove-NetFirewallRule -DisplayName "Node.js 5926"


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

// gRPC 서버 설정
const fishProtoPath = './fish_service.proto';
const datastoreProtoPath = './datastore_service.proto';

const fishPackageDefinition = protoLoader.loadSync(fishProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const datastorePackageDefinition = protoLoader.loadSync(datastoreProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const fishProtoDescriptor = grpc.loadPackageDefinition(fishPackageDefinition);
const datastoreProtoDescriptor = grpc.loadPackageDefinition(datastorePackageDefinition);

const fishProto = fishProtoDescriptor.fish;
const datastoreProto = datastoreProtoDescriptor.datastore;

// gRPC 서버 구현
const grpcServer = new grpc.Server();

// 물고기 서비스 구현
grpcServer.addService(fishProto.FishService.service, {
    startFishing: async (call, callback) => {
        try {
            const result = fishService.start();
            callback(null, result);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: '낚시 시작 중 오류가 발생했습니다.'
            });
        }
    },

    endFishing: async (call, callback) => {
        try {
            const { guid, success } = call.request;
            const result = await fishService.end(guid, success);
            callback(null, result);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: '낚시 종료 중 오류가 발생했습니다.'
            });
        }
    },

    getActiveFishSignals: async (call, callback) => {
        try {
            const signals = fishService.getFish();
            callback(null, { signals });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: '물고기 신호 조회 중 오류가 발생했습니다.'
            });
        }
    }
});

// 데이터스토어 서비스 구현
grpcServer.addService(datastoreProto.DatastoreService.service, {
    initLoad: async (call, callback) => {
        try {
            const { user_id } = call.request;
            const result = await datastoreService.initLoad(user_id);
            callback(null, result);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: '초기 데이터 로드 중 오류가 발생했습니다.'
            });
        }
    },

    getInventoryData: async (call, callback) => {
        try {
            const { user_id } = call.request;
            const result = await datastoreService.getInventoryData(user_id);
            callback(null, result);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: '인벤토리 데이터 조회 중 오류가 발생했습니다.'
            });
        }
    }
});

// 데이터 로드 실행
loadGameData();

// Express 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 설정 (상점 등 나머지 기능)
app.use('/api', routes);

// Express 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express 서버 실행 중: http://localhost:${PORT}`);
});

// gRPC 서버 시작
grpcServer.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
    grpcServer.start();
    console.log(`gRPC 서버 실행 중: localhost:${GRPC_PORT}`);
});
