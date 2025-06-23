const Steam = require('steam-web');
const { admin, db } = require('../config/firebaseConfig');
const { ref, get, set } = require('firebase/database');
require('dotenv').config();

// 스팀 API 설정
const steam = new Steam({
    apiKey: process.env.STEAM_API_KEY, // 환경변수에서 API 키를 가져옴
    format: 'json' // 응답 형식을 JSON으로 설정
});

/**
 * 스팀 인증 서비스
 * 스팀 로그인 및 권한 체크를 처리합니다.
 */
class SteamAuthService {
    /**
     * 스팀 유저 정보 조회
     */
    async getSteamUserInfo(steamId) {
        return new Promise((resolve, reject) => {
            steam.getPlayerSummaries({
                steamids: [steamId],
                callback: (err, data) => {
                    if (err) reject(err);
                    else resolve(data.response.players[0]);
                }
            });
        });
    }

    /**
     * 게임 소유 여부 확인
     */
    async ownsGame(steamId, appId) {
        return new Promise((resolve, reject) => {
            steam.getOwnedGames({
                steamid: steamId,
                callback: (err, data) => {
                    if (err) reject(err);
                    else {
                        const games = data.response.games || [];
                        resolve(games.some(game => game.appid === appId));
                    }
                }
            });
        });
    }

    /**
     * 스팀 유저 인증 및 계정 연동
     */
    async authenticateUser(steamId) {
        try {
            // 1. 스팀 유저 정보 조회
            const steamUser = await this.getSteamUserInfo(steamId);
            if (!steamUser) {
                throw new Error('Steam user not found');
            }

            // 2. 게임 소유 여부 확인 (YOUR_APP_ID는 실제 게임의 Steam AppID로 교체해야 함)
            const ownsGame = await this.ownsGame(steamId, process.env.STEAM_APP_ID);
            if (!ownsGame) {
                throw new Error('User does not own the game');
            }

            // 3. Firebase에 유저 정보 저장/업데이트
            const userRef = ref(db, `users/${steamId}`);
            const userSnapshot = await get(userRef);
            
            if (!userSnapshot.exists()) {
                // 새 유저 생성
                await set(userRef, {
                    steamId: steamId,
                    displayName: steamUser.personaname,
                    avatarUrl: steamUser.avatarfull,
                    money: 100, // 초기 자금
                    inventory: {}, // 빈 인벤토리
                    createdAt: Date.now()
                });
            } else {
                // 기존 유저 정보 업데이트
                await set(userRef, {
                    ...userSnapshot.val(),
                    steamId: steamId,
                    displayName: steamUser.personaname,
                    avatarUrl: steamUser.avatarfull,
                    lastLoginAt: Date.now()
                });
            }

            return {
                success: true,
                user: {
                    steamId: steamId,
                    displayName: steamUser.personaname,
                    avatarUrl: steamUser.avatarfull
                }
            };

        } catch (error) {
            console.error('Steam authentication error:', error);
            throw error;
        }
    }

    /**
     * 스팀 세션 티켓 검증
     */
    async verifySessionTicket(steamId, base64Ticket) {
        try {
            // Base64 디코딩
            const ticket = Buffer.from(base64Ticket, 'base64').toString('hex');
            
            const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
            const url = `https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1/?key=${process.env.STEAM_API_KEY}&appid=${process.env.STEAM_APP_ID}&ticket=${ticket}`;
            
            console.log('Verifying ticket:', {
                steamId,
                decodedTicket: ticket,
                url
            });

            const response = await fetch(url);
            const data = await response.json();

            console.log('Steam API Response:', data);

            if (
                data.response &&
                data.response.params &&
                data.response.params.result === 'OK' &&
                data.response.params.steamid === steamId
            ) {
                return true;
            } else {
                console.error('Steam verification failed:', data);
                return false;
            }
        } catch (err) {
            console.error('Steam session ticket verify error:', err);
            return false;
        }
    }
}

module.exports = new SteamAuthService(); 