import axios from 'axios';
import { GIFT_CODES } from '../constants/game-topics.js';

const BASE_URL = "https://hoyo-codes.seria.moe/codes";

export const GiftcodeHoyoverseGame = {
    data: {
        name: 'GiftcodeHoyoverseGame',
        description: 'Get active gift codes for Hoyoverse games',
        parameters: [
            {
                name: 'gameName',
                type: 'string',
                description: {
                    "vi": `Tên game Hoyoverse để lấy gift code. Các giá trị hợp lệ: ${Object.keys(GIFT_CODES).map(g => `\`${GIFT_CODES[g].id}\`: "${GIFT_CODES[g].name}"`).join(', ')}`,
                    "en": `Hoyoverse game name to get gift codes. Valid values: ${Object.keys(GIFT_CODES).map(g => `\`${GIFT_CODES[g].id}\`: ${GIFT_CODES[g].name}`).join(', ')}`
                },
                required: false,
                default: 'hkrpg'
            }
        ],
        returns: { 
            type: 'object', 
            description: 'An object containing gift codes data with game info, codes list, and redeem URLs' 
        },
    },
    async execute(client, interaction, gameName = 'hkrpg') {
        try {
            const game = GIFT_CODES[gameName.toLowerCase()];
            if (!game) {
                return {
                    error: 'Invalid game name',
                    validGames: Object.keys(GIFT_CODES),
                    message: 'Please choose from: hkrpg, genshin, honkai3rd, nap, tot'
                };
            }

            const response = await axios.get(BASE_URL, { 
                params: { game: game.id },
                timeout: 10000 
            });

            const data = response.data;
            
            if (!data || !data.codes) {
                return {
                    error: 'No data received from API',
                    gameName: game.name,
                    gameId: game.id
                };
            }

            const activeCodes = data.codes.filter(code => code.status === 'OK');
            
            return {
                success: true,
                game: {
                    name: game.name,
                    id: game.id,
                    redeemUrl: game.redeemUrl
                },
                codes: activeCodes.map(code => ({
                    id: code.id,
                    code: code.code,
                    rewards: code.rewards || 'Unknown rewards',
                    redeemLink: game.redeemUrl ? game.redeemUrl + code.code : null,
                    status: code.status
                })),
                totalCodes: activeCodes.length,
                fetchedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error fetching gift codes:', error);
            return {
                error: 'Failed to fetch gift codes',
                details: error.message,
                gameName: gameName
            };
        }
    }
};

// export const GameNewsHoyoverse = {
//     data: {
//         name: 'GameNewsHoyoverse',
//         description: 'Get latest news and updates for Hoyoverse games',
//         parameters: [
//             {
//                 name: 'gameName',
//                 type: 'string',
//                 description: {
//                     "vi": "Tên game để lấy tin tức. Các giá trị: hkrpg, genshin, honkai3rd, nap, tot",
//                     "en": "Game name to get news for. Values: hkrpg, genshin, honkai3rd, nap, tot"
//                 },
//                 required: false,
//                 default: 'hkrpg'
//             }
//         ],
//         returns: { 
//             type: 'object', 
//             description: 'Latest news and updates for the specified game' 
//         },
//     },
//     async execute(client, gameName = 'hkrpg') {
//         try {
//             const game = GIFT_CODES[gameName.toLowerCase()];
//             if (!game) {
//                 return {
//                     error: 'Invalid game name',
//                     validGames: Object.keys(GIFT_CODES)
//                 };
//             }

//             // This is a placeholder - you can implement actual news API here
//             return {
//                 success: true,
//                 game: game.name,
//                 message: 'News feature is under development. Currently only gift codes are available.',
//                 availableFeatures: ['Gift Codes']
//             };

//         } catch (error) {
//             return {
//                 error: 'Failed to fetch news',
//                 details: error.message
//             };
//         }
//     }
// };

// Export all game-related functions
const gameTopicsFunctions = {
    GiftcodeHoyoverseGame,
    // GameNewsHoyoverse,
};

export default gameTopicsFunctions;