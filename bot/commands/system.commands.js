import { 
    pingAction,
    getAvatarAction,
    getProfileAction,
    helpAction,
    getGuildInfoAction,
    getAboutMeAction
} from '../actions/system.actions.js';
import { SlashCommandBuilder } from 'discord.js';

export const PingCommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    cooldown: 5000,
    async execute(ctx) {
        return await pingAction(ctx);
    }
};

export const GetAvatarCommand = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Replies with the avatar of the user or mentioned user.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to get the avatar of')
                .setRequired(false)),
    cooldown: 5000,
    async execute(ctx) {
        const user = ctx.options.getUser('user') || ctx.user;
        return await getAvatarAction(ctx, { user });
    }
};

export const GetProfileCommand = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin cá nhân của bạn hoặc người khác')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Người dùng để xem thông tin')
                .setRequired(false)),
    cooldown: 5000,
    async execute(ctx) {
        const user = ctx.options.getUser('user') || ctx.user;
        return await getProfileAction(ctx, { user });
    }
};

export const HelpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiện thị danh sách lệnh có thể sử dụng')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Loại lệnh: prefix hoặc slash')
                .setRequired(false)
                .addChoices(
                    { name: 'prefix', value: 'prefix' },
                    { name: 'slash', value: 'slash' }
                ))
        .addIntegerOption(option => 
            option.setName('page')
                .setDescription('Số trang')
                .setRequired(false)),
    cooldown: 1000,
    async execute(ctx) {
        const type = ctx.options.getString('type') || 'slash';
        const page = ctx.options.getInteger('page') || 1;
        return await helpAction(ctx, {
            helpDocs: ctx.client.helpDocs,
            type,
            page
        });
    }
};

export const GetGuildInfoCommand = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Xem thông tin về server hiện tại'),
    cooldown: 5000,
    async execute(ctx) {
        return await getGuildInfoAction(ctx);
    }
};

export const GetAboutMeCommand = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Xem thông tin về bot'),
    cooldown: 5000,
    async execute(ctx) {
        return await getAboutMeAction(ctx);
    }
};

export default [
    PingCommand,
    GetAvatarCommand,
    GetProfileCommand,
    HelpCommand,
    GetGuildInfoCommand,
    GetAboutMeCommand
];