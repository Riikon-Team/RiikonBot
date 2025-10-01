import { getAvatarAction } from '../actions/system.js';

export default {
    data: {
        name: 'avatar',
        description: 'Replies with the avatar of the user or mentioned user.',
        cooldown: 5000,
    },
    async execute(message, args) {
        const user = message.mentions.users.first() || message.author;
        const reply = getAvatarAction( this.data.name, user, true);
        await message.reply(reply);
    }
};