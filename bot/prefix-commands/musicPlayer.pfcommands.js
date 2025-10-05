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

export const PlayPrefixCommand = {
    data: {
        name: 'play',
        aliases: ['p'],
        description: 'Phát nhạc từ URL hoặc tìm kiếm',
        usage: 'play <URL/từ khóa> [add_first]',
        category: 'Music',
        cooldown: 3000,
    },
    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'play');
        const query = args[0];
        const addFirst = args[1] === 'add_first';
        return await playAction(ctx, { query, addFirst });
    }
};

export const PausePrefixCommand = {
    data: {
        name: 'pause',
        aliases: ['pa'],
        description: 'Tạm dừng bài hát đang phát',
        usage: 'pause',
        category: 'Music',
        cooldown: 2000,
    },
    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'pause');
        return await pauseAction(ctx);
    }
};

export const ResumePrefixCommand = {
    data: {
        name: 'resume',
        aliases: ['r'],
        description: 'Tiếp tục phát nhạc',
        usage: 'resume',
        category: 'Music',
        cooldown: 2000,
    },
    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'resume');
        return await resumeAction(ctx);
    }
};

export const SkipPrefixCommand = {
    data: {
        name: 'skip',
        aliases: ['s', 'next'],
        description: 'Chuyển bài tiếp theo',
        usage: 'skip [số bài]',
        category: 'Music',
        cooldown: 2000,
    },
    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'skip');
        const count = Number.parseInt(args[0]) || 1;

        if (count < 1 || count > 10) {
            return await skipAction(ctx, { count: 1 });
        }

        return await skipAction(ctx, { count });
    }
};

export const PreviousPrefixCommand = {
    data: {
        name: 'previous',
        aliases: ['prev', 'back'],
        description: 'Quay lại bài trước',
        usage: 'previous [số bài]',
        category: 'Music',
        cooldown: 2000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'previous');
        const count = Number.parseInt(args[0]) || 1;

        if (count < 1 || count > 10) {
            return await previousAction(ctx, { count: 1 });
        }

        return await previousAction(ctx, { count });
    }
};

export const QueuePrefixCommand = {
    data: {
        name: 'queue',
        aliases: ['q', 'list'],
        description: 'Xem hàng đợi nhạc',
        usage: 'queue [trang]',
        category: 'Music',
        cooldown: 2000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'queue');
        const page = Number.parseInt(args[0]) || 1;

        return await queueAction(ctx, { page: Math.max(1, page) });
    }
};

export const NowPlayingPrefixCommand = {
    data: {
        name: 'nowplaying',
        aliases: ['np', 'current'],
        description: 'Xem bài hát đang phát',
        usage: 'nowplaying',
        category: 'Music',
        cooldown: 2000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'nowplaying');
        return await nowPlayingAction(ctx);
    }
};

export const SearchPrefixCommand = {
    data: {
        name: 'search',
        aliases: ['find'],
        description: 'Tìm kiếm bài hát',
        usage: 'search <từ khóa>',
        category: 'Music',
        cooldown: 3000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'search');
        const query = args.join(' ');

        return await searchAction(ctx, { query });
    }
};

export const JoinPrefixCommand = {
    data: {
        name: 'join',
        aliases: ['connect'],
        description: 'Tham gia kênh voice',
        usage: 'join',
        category: 'Music',
        cooldown: 3000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'join');
        return await joinAction(ctx);
    }
};

export const LeavePrefixCommand = {
    data: {
        name: 'leave',
        aliases: ['disconnect', 'stop'],
        description: 'Rời khỏi kênh voice và xóa hàng đợi',
        usage: 'leave',
        category: 'Music',
        cooldown: 3000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'leave');
        return await leaveAction(ctx);
    }
};

export const VolumePrefixCommand = {
    data: {
        name: 'volume',
        aliases: ['vol', 'v'],
        description: 'Điều chỉnh âm lượng',
        usage: 'volume [1-100]',
        category: 'Music',
        cooldown: 2000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'volume');
        let volume = Number.parseInt(args[0]);

        // Validate volume
        if (args.length > 0 && (Number.isNaN(volume) || volume < 1 || volume > 100)) {
            volume = undefined; 
        }

        return await volumeAction(ctx, { volume });
    }
};

export const LoopPrefixCommand = {
    data: {
        name: 'loop',
        aliases: ['repeat'],
        description: 'Bật/tắt chế độ lặp lại',
        usage: 'loop',
        category: 'Music',
        cooldown: 2000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'loop');
        return await loopAction(ctx);
    }
};

export const ShufflePrefixCommand = {
    data: {
        name: 'shuffle',
        aliases: ['mix'],
        description: 'Xáo trộn hàng đợi',
        usage: 'shuffle',
        category: 'Music',
        cooldown: 3000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'shuffle');
        return await shuffleAction(ctx);
    }
};

export const RemovePrefixCommand = {
    data: {
        name: 'remove',
        aliases: ['rm', 'delete'],
        description: 'Xóa bài hát khỏi hàng đợi',
        usage: 'remove <vị trí>',
        category: 'Music',
        cooldown: 2000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'remove');
        const position = Number.parseInt(args[0]);

        return await removeAction(ctx, { position });
    }
};

export const LyricsPrefixCommand = {
    data: {
        name: 'lyrics',
        aliases: ['ly', 'lyric'],
        description: 'Lấy lời bài hát',
        usage: 'lyrics [tên bài - tên nghệ sĩ]',
        category: 'Music',
        cooldown: 3000,
    },

    async execute(message, args) {
        const ctx = new ContextAdapter(message, 'lyrics');
        const query = args.join(' ');

        return await lyricsAction(ctx, { query });
    }
};

// Export default array
export default [
    PlayPrefixCommand,
    PausePrefixCommand,
    ResumePrefixCommand,
    SkipPrefixCommand,
    PreviousPrefixCommand,
    QueuePrefixCommand,
    NowPlayingPrefixCommand,
    SearchPrefixCommand,
    JoinPrefixCommand,
    LeavePrefixCommand,
    VolumePrefixCommand,
    LoopPrefixCommand,
    ShufflePrefixCommand,
    RemovePrefixCommand,
    LyricsPrefixCommand
];