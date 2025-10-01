import { getAboutMeAction } from '../actions/system.js';

export default {
    data: {
        name: 'about',
        description: 'Giới thiệu về bot',
        cooldown: 5000,
    },
    async execute(message, args) {
        const reply = getAboutMeAction(this.data.name, message.client);
        await message.reply(reply);
    }
};