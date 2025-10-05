import { getGiftcodeAction } from '../actions/game-topics.actions.js';

export const GiftcodeCommand = {
    data: {
        name: 'giftcode',
        description: 'Lấy mã giftcode cho game (từ game của Hoyoverse). Mặc định là Honkai: Star Rail.',
        cooldown: 30000,
    },
    async execute(message, args) {
        const reply = await getGiftcodeAction(this.data.name, args[0] || 'hkrpg');
        await message.reply(reply);
    }
};

export default [
    GiftcodeCommand
];