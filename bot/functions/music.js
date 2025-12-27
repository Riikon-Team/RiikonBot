import { joinAction } from '../actions/music-player/join.action.js';
import { leaveAction } from '../actions/music-player/leave.action.js';
import { playAction } from '../actions/music-player/play.action.js';
import { pauseAction } from '../actions/music-player/pause.action.js';
import { resumeAction } from '../actions/music-player/resume.action.js';
import { skipAction } from '../actions/music-player/skip.action.js';
import { previousAction } from '../actions/music-player/previous.action.js';
import { queueAction } from '../actions/music-player/queue.action.js';
import { nowPlayingAction } from '../actions/music-player/nowplaying.action.js';
import { searchAction } from '../actions/music-player/search.action.js';
import { shuffleAction } from '../actions/music-player/shuffle.action.js';
import { loopAction } from '../actions/music-player/loop.action.js';
import { volumeAction } from '../actions/music-player/volume.action.js';
import { removeAction } from '../actions/music-player/remove.action.js';
import { lyricsAction } from '../actions/music-player/lyrics.action.js';

export const MusicJoin = {
    data: {
        name: 'MusicJoin',
        description: 'Bot joins the voice channel that the user is currently in',
        parameters: [],
        returns: {
            type: 'boolean',
            description: 'True if bot successfully joined the voice channel, false otherwise'
        }
    },
    async execute(client, interaction) {
        try {
            await joinAction(interaction);
            return { success: true, message: 'Đã tham gia kênh voice' };
        } catch (error) {
            console.error('MusicJoin error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicLeave = {
    data: {
        name: 'MusicLeave',
        description: 'Bot leaves the voice channel and clears the music queue',
        parameters: [],
        returns: {
            type: 'object',
            description: 'Object containing success status and number of songs cleared'
        }
    },
    async execute(client, interaction) {
        try {
            await leaveAction(interaction);
            return { success: true, message: 'Đã rời khỏi kênh voice và xóa hàng đợi' };
        } catch (error) {
            console.error('MusicLeave error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicPlay = {
    data: {
        name: 'MusicPlay',
        description: 'Play a song by searching for it or using a URL. Supports YouTube, Spotify, and other platforms',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: {
                    "vi": "Tên bài hát hoặc URL để phát. Có thể là từ YouTube, Spotify, hoặc các nền tảng khác",
                    "en": "Song name or URL to play. Can be from YouTube, Spotify, or other platforms"
                },
                required: true,
            },
            {
                name: 'addFirst',
                type: 'boolean',
                description: {
                    "vi": "Nếu true, thêm bài hát lên đầu hàng đợi. Mặc định là false (thêm vào cuối)",
                    "en": "If true, add song to the front of the queue. Default is false (add to end)"
                },
                required: false,
            }
        ],
        returns: {
            type: 'object',
            description: 'Object containing track information and queue status'
        }
    },
    async execute(client, interaction, query, addFirst = false) {
        try {
            await playAction(interaction, { query, addFirst });
            return { success: true, message: `Đang phát: ${query}` };
        } catch (error) {
            console.error('MusicPlay error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicPause = {
    data: {
        name: 'MusicPause',
        description: 'Pause the currently playing song',
        parameters: [],
        returns: {
            type: 'boolean',
            description: 'True if successfully paused, false if already paused or no song playing'
        }
    },
    async execute(client, interaction) {
        try {
            await pauseAction(interaction);
            return { success: true, message: 'Đã tạm dừng nhạc' };
        } catch (error) {
            console.error('MusicPause error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicResume = {
    data: {
        name: 'MusicResume',
        description: 'Resume the paused song',
        parameters: [],
        returns: {
            type: 'boolean',
            description: 'True if successfully resumed, false if already playing or no song paused'
        }
    },
    async execute(client, interaction) {
        try {
            await resumeAction(interaction);
            return { success: true, message: 'Đã tiếp tục phát nhạc' };
        } catch (error) {
            console.error('MusicResume error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicSkip = {
    data: {
        name: 'MusicSkip',
        description: 'Skip the current song or multiple songs in the queue',
        parameters: [
            {
                name: 'count',
                type: 'number',
                description: {
                    "vi": "Số bài hát cần bỏ qua. Mặc định là 1",
                    "en": "Number of songs to skip. Default is 1"
                },
                required: false,
            }
        ],
        returns: {
            type: 'boolean',
            description: 'True if successfully skipped, false otherwise'
        }
    },
    async execute(client, interaction, count = 1) {
        try {
            await skipAction(interaction, { count });
            return { success: true, message: `Đã bỏ qua ${count} bài` };
        } catch (error) {
            console.error('MusicSkip error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicPrevious = {
    data: {
        name: 'MusicPrevious',
        description: 'Go back to the previous song or multiple songs in the queue',
        parameters: [
            {
                name: 'count',
                type: 'number',
                description: {
                    "vi": "Số bài hát cần lùi lại. Mặc định là 1",
                    "en": "Number of songs to go back. Default is 1"
                },
                required: false,
            }
        ],
        returns: {
            type: 'boolean',
            description: 'True if successfully went back, false if already at the beginning'
        }
    },
    async execute(client, interaction, count = 1) {
        try {
            await previousAction(interaction, { count });
            return { success: true, message: `Đã lùi ${count} bài` };
        } catch (error) {
            console.error('MusicPrevious error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicQueue = {
    data: {
        name: 'MusicQueue',
        description: 'Display the current music queue with pagination support',
        parameters: [
            {
                name: 'page',
                type: 'number',
                description: {
                    "vi": "Số trang cần xem trong hàng đợi. Mặc định là 1",
                    "en": "Page number to view in the queue. Default is 1"
                },
                required: false,
            }
        ],
        returns: {
            type: 'object',
            description: 'Object containing queue information, current song, and total duration'
        }
    },
    async execute(client, interaction, page = 1) {
        try {
            await queueAction(interaction, { page });
            const player = client.musicPlayers?.get(interaction.guild.id);
            if (player) {
                const queueInfo = player.getQueue();
                return {
                    success: true,
                    total: queueInfo.total,
                    current: queueInfo.current?.title || null,
                    queue: queueInfo.queue.map(song => ({
                        title: song.title,
                        artist: song.artist,
                        duration: song.duration
                    }))
                };
            }
            return { success: false, error: 'No active player' };
        } catch (error) {
            console.error('MusicQueue error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicNowPlaying = {
    data: {
        name: 'MusicNowPlaying',
        description: 'Display information about the currently playing song',
        parameters: [],
        returns: {
            type: 'object',
            description: 'Object containing current track information, progress, and playback status'
        }
    },
    async execute(client, interaction) {
        try {
            await nowPlayingAction(interaction);
            const player = client.musicPlayers?.get(interaction.guild.id);
            if (player) {
                const track = player.getCurrentTrack();
                const artist = track ? (track.artist || (typeof track.artists === 'string' ? track.artists : 'Unknown')) : 'Unknown';
                return {
                    success: true,
                    currentTrack: track ? {
                        title: track.title,
                        artist: artist,
                        duration: track.duration,
                        url: track.url,
                        platform: track.platform
                    } : null,
                    paused: player.paused,
                    volume: player.volume,
                    loop: player.loop
                };
            }
            return { success: false, error: 'No song currently playing' };
        } catch (error) {
            console.error('MusicNowPlaying error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicSearch = {
    data: {
        name: 'MusicSearch',
        description: 'Search for songs and display results for user selection',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: {
                    "vi": "Từ khóa tìm kiếm để tìm bài hát",
                    "en": "Search query to find songs"
                },
                required: true,
            }
        ],
        returns: {
            type: 'object',
            description: 'Array of search results with song information'
        }
    },
    async execute(client, interaction, query) {
        try {
            await searchAction(interaction, { query });
            return { success: true, message: `Đã tìm kiếm: ${query}` };
        } catch (error) {
            console.error('MusicSearch error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicShuffle = {
    data: {
        name: 'MusicShuffle',
        description: 'Shuffle the songs in the current queue randomly',
        parameters: [],
        returns: {
            type: 'boolean',
            description: 'True if successfully shuffled, false if queue has less than 2 songs'
        }
    },
    async execute(client, interaction) {
        try {
            await shuffleAction(interaction);
            return { success: true, message: 'Đã xáo trộn hàng đợi' };
        } catch (error) {
            console.error('MusicShuffle error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicLoop = {
    data: {
        name: 'MusicLoop',
        description: 'Toggle loop mode for the current song',
        parameters: [],
        returns: {
            type: 'boolean',
            description: 'True if loop is now enabled, false if loop is now disabled'
        }
    },
    async execute(client, interaction) {
        try {
            await loopAction(interaction);
            const player = client.musicPlayers?.get(interaction.guild.id);
            return {
                success: true,
                loopEnabled: player?.loop || false,
                message: player?.loop ? 'Đã bật lặp lại' : 'Đã tắt lặp lại'
            };
        } catch (error) {
            console.error('MusicLoop error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicVolume = {
    data: {
        name: 'MusicVolume',
        description: 'Set the volume of the music player',
        parameters: [
            {
                name: 'volume',
                type: 'number',
                description: {
                    "vi": "Mức âm lượng từ 1 đến 100",
                    "en": "Volume level from 1 to 100"
                },
                required: true,
            }
        ],
        returns: {
            type: 'number',
            description: 'The new volume level'
        }
    },
    async execute(client, interaction, volume) {
        try {
            await volumeAction(interaction, { volume });
            return { success: true, volume, message: `Đã đặt âm lượng: ${volume}%` };
        } catch (error) {
            console.error('MusicVolume error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicRemove = {
    data: {
        name: 'MusicRemove',
        description: 'Remove a specific song from the queue by its position',
        parameters: [
            {
                name: 'position',
                type: 'number',
                description: {
                    "vi": "Vị trí của bài hát trong hàng đợi cần xóa (bắt đầu từ 1)",
                    "en": "Position of the song in the queue to remove (starting from 1)"
                },
                required: true,
            }
        ],
        returns: {
            type: 'object',
            description: 'Object containing information about the removed track'
        }
    },
    async execute(client, interaction, position) {
        try {
            await removeAction(interaction, { position });
            return { success: true, message: `Đã xóa bài hát ở vị trí ${position}` };
        } catch (error) {
            console.error('MusicRemove error:', error);
            return { success: false, error: error.message };
        }
    }
};

export const MusicLyrics = {
    data: {
        name: 'MusicLyrics',
        description: 'Get lyrics for the currently playing song or a specific song',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: {
                    "vi": "Tên bài hát và nghệ sĩ (định dạng: 'tên bài - tên nghệ sĩ'). Nếu để trống, sẽ lấy lời bài hát đang phát",
                    "en": "Song name and artist (format: 'song name - artist name'). If empty, will get lyrics for currently playing song"
                },
                required: false,
            }
        ],
        returns: {
            type: 'object',
            description: 'Object containing lyrics and song information'
        }
    },
    async execute(client, interaction, query = '') {
        try {
            await lyricsAction(interaction, { query });
            return { success: true, message: 'Đã tìm lời bài hát' };
        } catch (error) {
            console.error('MusicLyrics error:', error);
            return { success: false, error: error.message };
        }
    }
};

const funcs = {
    MusicJoin,
    MusicLeave,
    MusicPlay,
    MusicPause,
    MusicResume,
    MusicSkip,
    MusicPrevious,
    MusicQueue,
    MusicNowPlaying,
    MusicSearch,
    MusicShuffle,
    MusicLoop,
    MusicVolume,
    MusicRemove,
    MusicLyrics
};

export default funcs;