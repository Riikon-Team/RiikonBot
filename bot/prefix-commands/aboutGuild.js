import { getGuildInfoAction } from '../actions/system.js';

export default {
    data: {
        name: 'guild',
        description: 'Lấy thông tin về server hiện tại.',
        cooldown: 5000,
    },
    async execute(message, args) {
        const reply = getGuildInfoAction(this.data.name, message.guild);
        await message.reply(reply);
    }
};
