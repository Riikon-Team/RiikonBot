import {
    getGiftcodeAction
} from '../actions/game-topics.actions.js';
import { SlashCommandBuilder } from 'discord.js';
import { GIFT_CODES } from '../constants/game-topics.js';

export const getGiftcodeCommand = {
    data: new SlashCommandBuilder()
        .setName('giftcode')
        .setDescription('Lấy mã giftcode từ các game của Hoyoverse ( Genshin Impact, Honkai Star Rail, Honkai Impact 3 )')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Chọn game để lấy giftcode')
                .addChoices(
                    Object.values(GIFT_CODES).map(game => ({
                        name: game.name,
                        value: game.id
                    }))
                )
                .setRequired(true)),
    cooldown: 5000,
    async execute(ctx) {
        const game = ctx.options.getString('game');
        return await getGiftcodeAction(ctx, { game });
    }
};



export default [
    getGiftcodeCommand
];