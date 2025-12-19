import {
    getAboutMeAction,
    pingAction,
    getProfileAction,
    helpAction,
    getAvatarAction,
    getGuildInfoAction,
    getVoiceUsersAction
} from '../actions/system.actions.js';

export const AboutCommand = {
    data: {
        name: 'about',
        description: 'Giới thiệu về bot',
        cooldown: 5000,
        usage: 'about',
        aliases: []
    },
    async execute(ctx, args) {
        return getAboutMeAction(ctx);
    }
};

export const PingCommand = {
    data: {
        name: 'ping',
        description: 'Replies with Pong!',
        cooldown: 5000,
        usage: 'ping',
        aliases: []
    },
    async execute(ctx, args) {
        return pingAction(ctx);
    }
};

export const ProfileCommand = {
    data: {
        name: 'profile',
        description: 'Xem thông tin cá nhân của bạn hoặc người khác',
        cooldown: 5000,
        usage: "profile\nprofile <@user>",
        aliases: []
    },
    async execute(ctx, args) {
        const user = ctx.source.mentions.users.first() || ctx.source.author;
        return getProfileAction(ctx, { user });
    }
};

export const HelpCommand = {
    data: {
        name: 'help',
        description: 'Hiện thị danh sách lệnh có thể sử dụng',
        cooldown: 1000,
        usage: 'help [prefix|slash] [số trang]',
        aliases: ['h']
    },
    async execute(ctx, args) {
        const type = args.length > 0 ? args[0].toLowerCase() : 'prefix';
        const page = args.length > 1 ? Number.parseInt(args[1]) : 1;
        return helpAction(ctx, {
            helpDocs: ctx.client.helpDocs,
            type,
            page
        });
    }
};

export const AvatarCommand = {
    data: {
        name: 'avatar',
        description: 'Replies with the avatar of the user or mentioned user.',
        cooldown: 5000,
        usage: 'avatar\navatar <@user>',
        aliases: ['av']
    },
    async execute(ctx, args) {
        const user = ctx.source.mentions.users.first() || ctx.source.author;
        return getAvatarAction(ctx, {
            user,
            fullSize: true
        });
    }
};

export const GuildCommand = {
    data: {
        name: 'guild',
        description: 'Lấy thông tin về server hiện tại.',
        cooldown: 5000,
        usage: 'guild',
        aliases: ['server']
    },
    async execute(ctx, args) {
        return getGuildInfoAction(ctx);
    }
};

export const VoiceUsersCommand = {
    data: {
        name: 'voiceusers',
        description: 'Lấy danh sách người dùng trong kênh voice',
        cooldown: 5000,
        usage: 'voiceusers',
        aliases: ['vu']
    },
    async execute(ctx, args) {
        return getVoiceUsersAction(ctx);
    }
};


export default [
    AboutCommand,
    PingCommand,
    ProfileCommand,
    HelpCommand,
    AvatarCommand,
    GuildCommand,
    VoiceUsersCommand
];