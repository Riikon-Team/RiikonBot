import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType
} from '@discordjs/voice';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { RiknClient } from 'rikn-music-fetcher';
import path from 'node:path';

import {
    DEFAULT_VOLUME,
    VOICE_IDLE_TIMEOUT,
    VOICE_RECONNECT_TIMEOUT,
    PLATFORM_EMOJIS
} from '../constants/music.js';
import { E } from '../constants/bot.js';

class MusicPlayer {
    constructor(guild, textChannel, voiceChannel) {
        this.guild = guild;
        this.textChannel = textChannel;
        this.voiceChannel = voiceChannel;

        // Audio components
        this.audioPlayer = createAudioPlayer();
        this.connection = null;
        this.resource = null;

        // Queue system
        this.queue = [];
        this.currentTrack = null;

        // Player state
        this.volume = DEFAULT_VOLUME;
        this.loop = false;
        this.paused = false;

        // Timing
        this.startTime = null;
        this.pausedTime = 0;
        this.pausedAt = null;

        // Idle timeout
        this.idleTimeout = null;

        // Initialize RiknClient
        this.riknClient = new RiknClient({
            spotify: {
                clientId: process.env.SPOTIFY_CLIENT_ID,
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET
            },
            ytmusic: {
                cookiesPath: path.join(process.cwd(), 'bin', 'yt-music.txt'),
                GL: 'US',
                HL: 'en'
            },
            ytdlp: {
                cookiesPath: path.join(process.cwd(), 'bin', 'yt.txt'),
                binDir: path.join(process.cwd(), 'bin'),
                autoUpdate: true,
                updateIntervalDays: 7,
            }
        });

        // Setup events
        this.setupEvents();
    }

    setupEvents() {
        // Audio player events
        this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
            this.startTime = Date.now();
            this.paused = false;
            this.pausedTime = 0;
            this.pausedAt = null;
            this.resetIdleTimeout();
        });

        this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
            if (!this.pausedAt) {
                this.pausedAt = Date.now();
            }
            this.paused = true;
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            await this.handleTrackEnd();
        });

        this.audioPlayer.on('error', (error) => {
            console.error('🎵 Audio player error:', error);
            this.handleError(error);
        });
    }

    setupConnectionEvents() {
        if (!this.connection) return;

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
            } catch (error) {
                this.connection.destroy();
                this.startIdleTimeout();
            }
        });

        this.connection.on('error', (error) => {
            console.error('🔌 Voice connection error:', error);
        });
    }

    async connect() {
        try {
            this.connection = joinVoiceChannel({
                channelId: this.voiceChannel.id,
                guildId: this.guild.id,
                adapterCreator: this.guild.voiceAdapterCreator,
            });

            this.setupConnectionEvents();
            this.connection.subscribe(this.audioPlayer);

            await entersState(this.connection, VoiceConnectionStatus.Ready, VOICE_RECONNECT_TIMEOUT);
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to voice channel:', error);
            return false;
        }
    }

    disconnect() {
        this.clearIdleTimeout();

        if (this.connection && this.connection.state.status !== 'destroyed') {
            try {
                this.connection.destroy();
            } catch (error) {
                console.error('Error destroying connection:', error);
            }
        }
        this.connection = null;
    }

    // ==================== QUEUE MANAGEMENT ====================

    async addTracks(input, requestedBy) {
        const tracks = await this.resolveInput(input);
        console.log('🔍 Resolved tracks:', tracks);

        if (!tracks || tracks.length === 0) {
            throw new Error('Không tìm thấy bài hát nào');
        }

        const addedTracks = [];

        for (const track of tracks) {
            track.requestedBy = requestedBy;
            track.addedAt = Date.now();
            this.queue.push(track);
            addedTracks.push(track);
        }

        return {
            tracks: addedTracks,
            isPlaylist: tracks.length > 1
        };
    }

    async addTracksFirst(input, requestedBy) {
        const tracks = await this.resolveInput(input);

        if (!tracks || tracks.length === 0) {
            throw new Error('Không tìm thấy bài hát nào');
        }

        const addedTracks = [];
        const insertPosition = this.currentTrack ? 1 : 0;

        for (let i = tracks.length - 1; i >= 0; i--) {
            const track = tracks[i];
            track.requestedBy = requestedBy;
            track.addedAt = Date.now();
            this.queue.splice(insertPosition, 0, track);
            addedTracks.unshift(track);
        }

        return {
            tracks: addedTracks,
            isPlaylist: tracks.length > 1
        };
    }

    async resolveInput(input) {
        try {
            // Kiểm tra nếu là URL
            if (input.includes('http://') || input.includes('https://')) {
                // Kiểm tra playlist
                if (input.includes('playlist') || input.includes('album')) {
                    const tracks = await this.riknClient.getSongsByPlaylist(input);
                    console.log('🔍 Resolved playlist tracks:', tracks);
                    return tracks || [];
                }

                // Single track
                const track = await this.riknClient.getSongByUrl(input, false);
                return track ? [track] : [];
            }

            // Search query
            const tracks = await this.riknClient.searchSong(input, 'youtube');
            return tracks && tracks.length > 0 ? [tracks[0]] : [];
        } catch (error) {
            console.error('❌ Resolve input error:', error);
            throw error;
        }
    }

    // ==================== PLAYBACK CONTROL ====================

    async play() {
        if (this.queue.length === 0) {
            console.log('❌ No tracks in queue');
            return null;
        }

        const track = this.queue[0];

        try {
            // Connect trước khi stream
            if (!this.connection || this.connection.state.status === 'destroyed') {
                console.log('🔌 Connecting to voice channel...');
                const connected = await this.connect();
                if (!connected) {
                    throw new Error('Không thể kết nối voice channel');
                }
            }

            const artist = track ? (track.artist || (typeof track.artists === 'string' ? track.artists : 'Unknown')) : 'Unknown';
            console.log(`🎵 Playing: ${track.title} - ${artist}`);

            // Lấy stream từ RiknClient
            const stream = await this.riknClient.streamSongByUrl(track.url);

            const resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });

            // Set volume
            if (resource.volume) {
                resource.volume.setVolume(this.volume / 100);
            }

            this.resource = resource;
            this.audioPlayer.play(resource);
            this.currentTrack = track;

            return track;
        } catch (error) {
            console.error('❌ Play error:', error);
            throw error;
        }
    }

    pause() {
        if (!this.paused) {
            this.audioPlayer.pause();
            this.paused = true;
            return true;
        }
        return false;
    }

    resume() {
        if (this.paused) {
            this.audioPlayer.unpause();
            this.paused = false;
            if (this.pausedAt) {
                this.pausedTime += Date.now() - this.pausedAt;
                this.pausedAt = null;
            }
            return true;
        }
        return false;
    }

    async skip(count = 1) {
        if (count < 1) return false;

        // Nếu chỉ còn 1 bài hoặc skip nhiều hơn số bài còn lại
        if (count >= this.queue.length) {
            // Stop và clear queue
            this.audioPlayer.stop();
            this.queue = [];
            return true;
        }

        // Skip n-1 bài, bài thứ n sẽ được phát
        for (let i = 0; i < count - 1; i++) {
            this.queue.shift();
        }

        // Stop bài hiện tại, handleTrackEnd sẽ phát bài tiếp
        this.audioPlayer.stop();
        return true;
    }

    async previous() {
        // Not implemented - would need history tracking
        return false;
    }

    stop() {
        this.audioPlayer.stop();
        this.queue = [];
        this.currentTrack = null;
        this.disconnect();
    }

    async handleTrackEnd() {
        if (this.loop && this.currentTrack) {
            // Lặp lại bài hiện tại
            await this.play();
            return;
        }

        // Remove current track and play next
        if (this.queue.length > 0) {
            this.queue.shift();
        }

        if (this.queue.length > 0) {
            const nextTrack = await this.play();

            // Send notification about next track
            if (nextTrack && this.textChannel) {
                const artist = nextTrack ? (nextTrack.artist || (typeof nextTrack.artists === 'string' ? nextTrack.artists : 'Unknown')) : 'Unknown';
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('⏭ Đang phát tiếp')
                    .setDescription(`**[${nextTrack.title}](${nextTrack.url})**`)
                    .addFields(
                        { name: 'Nghệ sĩ', value: artist, inline: true },
                        { name: 'Thời lượng', value: this.formatDuration(nextTrack.duration), inline: true },
                        { name: 'Còn lại', value: `${this.queue.length - 1} bài`, inline: true }
                    )
                    .setThumbnail(nextTrack.images?.[0]?.url || null);

                // Add control buttons
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('music_pause')
                        .setEmoji('⏸')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_resume')
                        .setEmoji('▶')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('music_skip')
                        .setEmoji('⏭')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('music_stop')
                        .setEmoji('⏹')
                        .setStyle(ButtonStyle.Danger)
                );

                this.textChannel.send({ embeds: [embed], components: [row] }).catch(console.error);
            }
        } else {
            // Hết hàng đợi
            this.currentTrack = null;

            if (this.textChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('Hết hàng chờ')
                    .setDescription('Không còn bài hát nào trong hàng đợi!');

                this.textChannel.send({ embeds: [embed] }).catch(console.error);
            }

            this.startIdleTimeout();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        this.resource?.volume?.setVolume(this.volume / 100);
        return this.volume;
    }

    setLoop(enabled) {
        this.loop = enabled;
        return this.loop;
    }

    shuffleQueue() {
        if (this.queue.length <= 1) return false;

        const currentTrack = this.currentTrack;
        const remainingTracks = this.queue.slice(1);

        // Shuffle only the songs after current
        for (let i = remainingTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
        }

        this.queue = currentTrack ? [currentTrack, ...remainingTracks] : remainingTracks;
        return true;
    }

    removeTrack(index) {
        if (index < 0 || index >= this.queue.length) {
            return null;
        }

        if (index === 0 && this.currentTrack) {
            throw new Error('Không thể xóa bài đang phát');
        }

        const removed = this.queue.splice(index, 1)[0];
        return removed;
    }

    clearQueue() {
        const currentTrack = this.currentTrack;
        const cleared = this.queue.length;

        if (currentTrack) {
            this.queue = [currentTrack];
        } else {
            this.queue = [];
        }

        return cleared - this.queue.length;
    }

    // ==================== IDLE TIMEOUT ====================

    startIdleTimeout() {
        this.clearIdleTimeout();

        this.idleTimeout = setTimeout(() => {
            this.disconnect();

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`${E.exit} Đã rời kênh voice`)
                .setDescription('Bot đã rời khỏi kênh voice do không hoạt động trong 1 phút');

            this.textChannel?.send({ embeds: [embed] }).catch(() => { });
        }, VOICE_IDLE_TIMEOUT);
    }

    resetIdleTimeout() {
        this.clearIdleTimeout();
    }

    clearIdleTimeout() {
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }
    }

    // ==================== UTILITY METHODS ====================

    getCurrentTrack() {
        return this.currentTrack;
    }

    getQueue() {
        return {
            current: this.currentTrack,
            queue: this.queue,
            total: this.queue.length,
            upcoming: this.queue.slice(1)
        };
    }

    getCurrentTime() {
        if (!this.startTime) return 0;

        if (this.paused && this.pausedAt) {
            return (this.pausedAt - this.startTime - this.pausedTime) / 1000;
        }

        return (Date.now() - this.startTime - this.pausedTime) / 1000;
    }

    async getLyrics(trackName, artistName, albumName = null, duration = null) {
        try {
            const lyrics = await this.riknClient.getLyrics(trackName, artistName, albumName, duration);
            return lyrics;
        } catch (error) {
            console.error('❌ Get lyrics error:', error);
            return null;
        }
    }

    handleError(error) {
        console.error('Music player error:', error);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi phát nhạc`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        this.textChannel?.send({ embeds: [embed] }).catch(() => { });
    }

    cleanup() {
        this.clearIdleTimeout();
        this.stop();
    }

    formatDuration(seconds) {
        if (!seconds || Number.isNaN(seconds)) return '0:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    getPlatformEmoji(platform) {
        return PLATFORM_EMOJIS[platform] || '🎵';
    }
}

export default MusicPlayer;