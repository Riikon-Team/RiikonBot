// Music player constants
import { E } from './bot.js';
export const DEFAULT_VOLUME = 100;
export const QUEUE_PAGE_SIZE = 10;
export const MAX_PLAYLIST_SIZE = 100;
export const SEARCH_RESULTS_LIMIT = 20;

// Voice connection timeouts
export const VOICE_IDLE_TIMEOUT = 300000; // 5 minutes
export const VOICE_RECONNECT_TIMEOUT = 60000; // 1 minute

// Stream settings
export const STREAM_BITRATE = 192;
export const STREAM_TYPE = 'opus';
export const FFMPEG_ARGS = [
    '-analyzeduration', '0',
    '-loglevel', '0',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2'
];

// Platform emojis
export const PLATFORM_EMOJIS = {
    youtube: E.youtube,
    spotify: E.spotify,
    soundcloud: '🟠',
    direct: '🔗'
};

// Status emojis
export const STATUS_EMOJIS = {
    playing: '▶',
    paused: '⏸',
    stopped: '⏹',
    loading: E["5456bocchioverload"],
    error: E.error,
    success: E.success,
    queue: E.KittyPaw17,
    loop: E.loop,
    shuffle: '🔀',
    volume: '🔊'
};

export default {
    DEFAULT_VOLUME,
    QUEUE_PAGE_SIZE,
    MAX_PLAYLIST_SIZE,
    SEARCH_RESULTS_LIMIT,
    VOICE_IDLE_TIMEOUT,
    VOICE_RECONNECT_TIMEOUT,
    STREAM_BITRATE,
    STREAM_TYPE,
    FFMPEG_ARGS,
    PLATFORM_EMOJIS,
    STATUS_EMOJIS
};