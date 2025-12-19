import { SlashCommandBuilder } from 'discord.js';
import { ContextAdapter } from '../contexts/ContextAdapter.js';
import { playAction } from '../actions/music-player/play.action.js';
import { pauseAction } from '../actions/music-player/pause.action.js';
import { resumeAction } from '../actions/music-player/resume.action.js';
import { skipAction } from '../actions/music-player/skip.action.js';
import { previousAction } from '../actions/music-player/previous.action.js';
import { queueAction } from '../actions/music-player/queue.action.js';
import { nowPlayingAction } from '../actions/music-player/nowplaying.action.js';
import { searchAction } from '../actions/music-player/search.action.js';
import { leaveAction } from '../actions/music-player/leave.action.js';
import { joinAction } from '../actions/music-player/join.action.js';
import { volumeAction } from '../actions/music-player/volume.action.js';
import { loopAction } from '../actions/music-player/loop.action.js';
import { shuffleAction } from '../actions/music-player/shuffle.action.js';
import { removeAction } from '../actions/music-player/remove.action.js';
import { lyricsAction } from '../actions/music-player/lyrics.action.js';

export const PlayCommand = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát nhạc từ URL hoặc tìm kiếm')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('URL hoặc từ khóa tìm kiếm')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('add_first')
                .setDescription('Thêm vào đầu hàng đợi')
                .setRequired(false)),

    cooldown: 3000,

    async execute(ctx) {
        await ctx.defer();

        const query = ctx.getOption('query');
        const addFirst = ctx.getOption('add_first', 'boolean') || false;

        return await playAction(ctx, { query, addFirst });
    }
};

export const PauseCommand = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Tạm dừng bài hát đang phát'),

    cooldown: 2000,

    async execute(ctx) {
        return await pauseAction(ctx);
    }
};

export const ResumeCommand = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Tiếp tục phát nhạc'),

    cooldown: 2000,

    async execute(ctx) {
        return await resumeAction(ctx);
    }
};

export const SkipCommand = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Chuyển bài tiếp theo')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Số bài muốn skip')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    cooldown: 2000,

    async execute(ctx) {
        const count = ctx.getOption('count', 'integer') || 1;

        return await skipAction(ctx, { count });
    }
};

export const PreviousCommand = {
    data: new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Quay lại bài trước')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Số bài muốn lùi')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    cooldown: 2000,

    async execute(ctx) {
        await ctx.defer();

        const count = ctx.getOption('count', 'integer') || 1;

        return await previousAction(ctx, { count });
    }
};

export const QueueCommand = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Xem hàng đợi nhạc')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Số trang')
                .setRequired(false)
                .setMinValue(1)),

    cooldown: 2000,

    async execute(ctx) {
        await ctx.defer();

        const page = ctx.getOption('page', 'integer') || 1;

        return await queueAction(ctx, { page });
    }
};

export const NowPlayingCommand = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Xem bài hát đang phát'),

    cooldown: 2000,

    async execute(ctx) {
        return await nowPlayingAction(ctx);
    }
};

export const SearchCommand = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Tìm kiếm bài hát')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Từ khóa tìm kiếm')
                .setRequired(true)),

    cooldown: 3000,

    async execute(ctx) {
        const query = ctx.getOption('query');

        return await searchAction(ctx, { query });
    }
};

export const JoinCommand = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Tham gia kênh voice'),

    cooldown: 3000,

    async execute(ctx) {
        await ctx.defer();

        return await joinAction(ctx);
    }
};

export const LeaveCommand = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Rời khỏi kênh voice và xóa hàng đợi'),

    cooldown: 3000,

    async execute(ctx) {
        await ctx.defer();

        return await leaveAction(ctx);
    }
};

export const VolumeCommand = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Điều chỉnh âm lượng')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Mức âm lượng (1-100)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)),

    cooldown: 2000,

    async execute(ctx) {
        const volume = ctx.getOption('level', 'integer');

        return await volumeAction(ctx, { volume });
    }
};

export const LoopCommand = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Bật/tắt chế độ lặp lại'),

    cooldown: 2000,

    async execute(ctx) {
        return await loopAction(ctx);
    }
};

export const ShuffleCommand = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Xáo trộn hàng đợi'),

    cooldown: 3000,

    async execute(ctx) {
        return await shuffleAction(ctx);
    }
};

export const RemoveCommand = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Xóa bài hát khỏi hàng đợi')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Vị trí bài hát cần xóa')
                .setRequired(true)
                .setMinValue(1)),

    cooldown: 2000,

    async execute(ctx) {
        await ctx.defer();

        const position = ctx.getOption('position', 'integer');

        return await removeAction(ctx, { position });
    }
};

export const LyricsCommand = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Lấy lời bài hát')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên bài - Tên nghệ sĩ (để trống để lấy bài đang phát)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('sync')
                .setDescription('Đồng bộ lyrics theo thời gian (chỉ khi đang phát nhạc)')
                .setRequired(false)),

    cooldown: 3000,

    async execute(ctx) {
        const query = ctx.getOption('query') || '';
        const sync = ctx.getOption('sync', 'boolean') || false;

        return await lyricsAction(ctx, { query, sync });
    }
};

// Export default array
export default [
    PlayCommand,
    PauseCommand,
    ResumeCommand,
    SkipCommand,
    PreviousCommand,
    QueueCommand,
    NowPlayingCommand,
    SearchCommand,
    JoinCommand,
    LeaveCommand,
    VolumeCommand,
    LoopCommand,
    ShuffleCommand,
    RemoveCommand,
    LyricsCommand
];