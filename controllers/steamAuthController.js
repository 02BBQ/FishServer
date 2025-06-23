const steamAuthService = require('../services/steamAuthService');

/**
 * 스팀 인증 컨트롤러
 */
exports.authenticateWithSteam = async (req, res) => {
    try {
        const { steamId, ticket } = req.body;
        
        if (!steamId || !ticket) {
            return res.status(400).json({
                success: false,
                message: 'Steam ID와 세션 티켓이 필요해!' // tsundere ver
            });
        }

        // 세션 티켓 검증
        const isValid = await steamAuthService.verifySessionTicket(steamId, ticket);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: '스팀 인증 실패! 거짓말하지 마, 바보야!' // tsundere ver
            });
        }

        const result = await steamAuthService.authenticateUser(steamId);
        res.json(result);
    } catch (error) {
        console.error('Steam authentication error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}; 