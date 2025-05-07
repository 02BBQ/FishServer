const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fishService = require('./services/fishService');

// proto 파일 로드
const PROTO_PATH = './config/message.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const fishProto = protoDescriptor.fish;

// gRPC 서버 구현
const server = new grpc.Server();

// 서비스 구현
server.addService(fishProto.FishService.service, {
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

// 서버 시작
const PORT = 50051;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC 서버가 포트 ${PORT}에서 실행 중입니다.`);
}); 