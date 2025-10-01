import { getProfileAction } from '../actions/system.js';

export default {
    data: {
        name: 'profile',
        description: 'Xem thông tin cá nhân của bạn hoặc người khác',
        cooldown: 5000,
    },
    async execute(message, args) {
        const user = message.mentions.users.first() || message.author;
        const reply = getProfileAction(this.data.name, user);
        await message.reply(reply);
    }
};