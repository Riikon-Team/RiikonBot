import { pingAction } from '../actions/system.js';

export default {
    data: {
        name: 'ping',
        description: 'Replies with Pong!',
        cooldown: 5000,
    },
    async execute(message, args) {
        const reply = pingAction(this.data.name, message);
        await message.reply(reply);
    }
};