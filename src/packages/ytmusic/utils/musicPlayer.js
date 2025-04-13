import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice';
import { Collection } from 'discord.js';
import ytdlpManager from './yt-dlp.js';
import { getYouTubeAPI } from './youtubei.js';
import logger from '../../../utils/logger.js';
import { Embed, TYPE } from './embed.js';
import { EMOIJS } from '../../../constant/emoijs.js';


/**
 * @typedef {Object} Queue
 * @property {Array} songs - Array of song objects
 * @property {boolean} playing - Indicates if a song is currently playing
 * @property {boolean} loop - Indicates if the queue is in loop mode
 * @property {TextChannel} textChannel - Text channel for sending messages
 * @property {number} volume - Volume level (0-100)
 */

/**
 * @typedef {Object} Song
 * @property {string} idVideo - YouTube video ID
 * @property {string} title - Title of the song
 * @property {string} url - URL of the song
 * @property {string} duration - Duration of the song in MM:SS format
 * @property {string} thumbnail - Thumbnail URL of the song
 * @property {string} author - Author of the song
 */

/**
 * @class MusicPlayer
 * @description Manages music playback in Discord voice channels using yt-dlp and YouTube API
 * @property {Collection} queues - Stores song queues for each guild
 * @property {Collection} players - Stores audio players for each guild
 * @property {Collection} connections - Stores voice connections for each guild
 */
export class MusicPlayer {
  constructor(client) {
    this.client = client;
    this.queues = new Collection(); // Store song queues for each guild
    this.players = new Collection(); // Store audio players for each guild
    this.connections = new Collection(); // Store voice connections for each guild
    this.youtubeAPI = null; // YouTube API instance
  }

  /**
   * Initialize resources needed for music playback
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize YouTube API
      this.youtubeAPI = await getYouTubeAPI();
      logger.info('Music player initialized YouTube API');
    } catch (error) {
      logger.error('Failed to initialize YouTube API:', error);
      // Don't throw here, as we'll check for API availability in each method
    }
  }

  /**
   * Get the queue for a guild, or create one if it doesn't exist
   * @param {string} guildId - Discord guild ID
   * @returns {Queue} Queue for the guild
   */
  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        songs: [],
        playing: false,
        loop: false,
        textChannel: null,
        volume: 100,
      });
    }
    return this.queues.get(guildId);
  }

  /**
   * Join a voice channel and setup audio player
   * @param {VoiceChannel} voiceChannel - Discord voice channel to join (VoiceChannel)
   * @param {TextChannel} textChannel - Text channel for status messages (TextChannel)
   * @returns {boolean} Success status
   */
  async joinChannel(voiceChannel, textChannel) {
    try {
      const guildId = voiceChannel.guild.id;
      // Update queue with text channel
      const queue = this.getQueue(guildId);
      queue.textChannel = textChannel;

      // Create connection to voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      // Create audio player
      const player = createAudioPlayer();
      connection.subscribe(player);

      // Store the connection and player
      this.connections.set(guildId, connection);
      this.players.set(guildId, player);

      // Handle connection errors
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            new Promise(resolve => connection.once(VoiceConnectionStatus.Reconnecting, resolve)),
            new Promise((_, reject) => setTimeout(() => reject(), 5000))
          ]);
        } catch (error) {
          connection.destroy();
          this.clearQueue(guildId);
        }
      });

      // Handle player state changes
      player.on(AudioPlayerStatus.Idle, () => {
        this.playNext(guildId);
      });

      player.on('error', error => {
        logger.error(`Audio player error in guild ${guildId}:`, error);
        textChannel.send({
          embeds: [Embed.notify('Error', `Audio player error: ${error.message}`, TYPE.ERROR)],
        });
        this.playNext(guildId);
      });

      logger.info(`Joined voice channel in guild ${guildId}`);
      return true;
    } catch (error) {
      logger.error('Error joining voice channel:', error);
      return false;
    }
  }

  /**
   * Add a song to the queue
   * @param {string} guildId - Discord guild ID
   * @param {Song} song - Song object with title, url, duration, etc.
   */
  addToQueue(guildId, song, orderBy = null) {
    // Ensure the queue exists
    const queue = this.getQueue(guildId);
    song.orderBy = orderBy || 'Unknown';
    queue.songs.push(song);

    // If not playing, start playback
    if (!queue.playing && queue.songs.length === 1) {
      this.playSong(guildId, song, orderBy);
    }
  }

  /**
   * Play a song using yt-dlp
   * @param {string} guildId - Discord guild ID
   * @param {Song} song - Song to play
   */
  async playSong(guildId, song, orderBy = null) {
    try {
      const queue = this.getQueue(guildId);
      const player = this.players.get(guildId);

      if (!player) {
        logger.error(`No audio player found for guild ${guildId}`);
        return;
      }

      // Get stream for the song
      const stream = await ytdlpManager.streamAudio(song.videoId);

      // Create Discord.js audio resource
      const resource = createAudioResource(stream, {
        inlineVolume: true,
        metadata: {
          title: song.title,
        },
      });

      // Set volume
      resource.volume.setVolume(queue.volume / 100);

      // Play the song
      player.play(resource);
      queue.playing = true;

      // Send now playing message
      if (queue.textChannel) {
        queue.textChannel.send({
          embeds: [Embed.infoMusicPlaying(
            song.title,
            song.author,
            song.duration,
            song.thumbnail,
            song.url,
            orderBy,
            queue?.songs?.length >= 1 ? `${queue.songs.length - 1}` : '?')],

        })
      }

      logger.info(`Started playing "${song.title}" in guild ${guildId}`);
    } catch (error) {
      logger.error(`Error playing song in guild ${guildId}:`, error);

      if (queue.textChannel) {
        queue.textChannel.send({
          embeds: [Embed.notify('Error', `Failed to play song: ${error.message}`, TYPE.ERROR)],
        });
      }

      // Try to play next song
      this.playNext(guildId);
    }
  }

  /**
   * Play the next song in the queue
   * @param {string} guildId - Discord guild ID
   */
  playNext(guildId) {
    const queue = this.getQueue(guildId);

    if (queue.loop && queue.songs.length > 0) {
      // If loop is enabled, move current song to the end of queue
      const currentSong = queue.songs.shift();
      queue.songs.push(currentSong);
    } else {
      // Remove the first song (just played)
      queue.songs.shift();
    }

    // If there are more songs, play the next one
    if (queue.songs.length > 0) {
      this.playSong(guildId, queue.songs[0], queue.songs[0].orderBy);
    } else {
      // No more songs, mark as not playing
      queue.playing = false;
      if (queue.textChannel) {
        queue.textChannel.send({
          embeds: [Embed.notify('Queue', `No more songs in the queue. ${EMOIJS["5456bocchioverload"]}`, TYPE.INFO)],
        });
      }
    }
  }

  /**
   * Pause playback
   * @param {string} guildId - Discord guild ID
   * @returns {boolean} Whether pause was successful
   */
  pausePlayback(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      // const queue = this.getQueue(guildId);
      // queue.playing = false;
      // queue.textChannel.send({
      //   embeds: [Embed.notify('Paused', 'Playback paused.', TYPE.INFO)],
      // });
      return player.pause();
    }
    return false;
  }

  /**
   * Resume playback
   * @param {string} guildId - Discord guild ID
   * @returns {boolean} Whether resume was successful
   */
  resumePlayback(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      // const queue = this.getQueue(guildId);
      // queue.playing = true;
      // queue.textChannel.send({
      //   embeds: [Embed.notify('Resumed', 'Playback resumed.', TYPE.INFO)],
      // });
      return player.unpause();
    }
    return false;
  }

  /**
   * Skip the current song
   * @param {string} guildId - Discord guild ID
   */
  skipSong(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.stop();
      // const queue = this.getQueue(guildId);
      // queue.textChannel.send({
      //   embeds: [Embed.notify('Skipped', 'Skipped the current song.', TYPE.INFO)],
      // });
      return true;
    }

    return false;
  }

  /**
   * Skip multiple songs
   * @param {string} guildId - Discord guild ID
   * @param {number} count - Number of songs to skip (default: 1)
   * @returns {boolean} Whether skip was successful
   */
  skipSongs(guildId, count = 1) {
    const player = this.players.get(guildId);
    const queue = this.getQueue(guildId);
    
    if (!player || !queue || queue.songs.length === 0) {
      return false;
    }
    
    // Ensure count is a valid number
    count = Math.max(1, Math.min(count, queue.songs.length));
    
    // If skipping only the current song or skipping to the end
    if (count === 1 || count >= queue.songs.length) {
      player.stop(); // This will trigger the 'idle' event and play the next song
      return true;
    }
    
    // If skipping multiple songs, but not all
    // Remove the songs that should be skipped (except the first one)
    queue.songs.splice(1, count - 1);
    
    // Then stop the current song to trigger the next song playback
    player.stop();
    
    return true;
  }

  /**
   * Shuffle the songs in the queue
   * @param {string} guildId - Discord guild ID
   * @returns {number} Number of songs shuffled
   */
  shuffleQueue(guildId) {
    const queue = this.getQueue(guildId);
    
    // Keep the currently playing song (index 0) and shuffle the rest
    const currentSong = queue.songs.shift();
    
    // Fisher-Yates shuffle algorithm
    for (let i = queue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
    
    // Put the current song back at the beginning
    queue.songs.unshift(currentSong);
    
    return queue.songs.length - 1; // Return number of songs shuffled (excluding current)
  }

  /**
   * Extract playlist ID from YouTube URL
   * @param {string} url - YouTube URL
   * @returns {string|null} Playlist ID or null if not found
   */
  extractPlaylistId(url) {
    if (!url) return null;

    // Match playlist ID from URL
    const match = url.match(/[&?]list=([^&]+)/i);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  /**
   * Check if playlist is a YouTube Mix/Radio playlist
   * @param {string} playlistId - YouTube playlist ID
   * @returns {boolean} True if it's a Mix/Radio playlist
   */
  isRadioPlaylist(playlistId) {
    return playlistId && playlistId.startsWith('RD');
  }

  /**
   * Get songs from a YouTube playlist
   * @param {string} playlistId - YouTube playlist ID
   * @param {number} limit - Maximum number of songs to retrieve
   * @returns {Promise<Array>} List of songs
   */
  async getPlaylistSongs(playlistId, limit = 20) {
    try {
      // Ensure we have a valid YouTube API instance
      if (!this.youtubeAPI) {
        logger.warn('YouTube API not initialized, trying to initialize now');
        await this.initialize();

        if (!this.youtubeAPI) {
          throw new Error('YouTube API could not be initialized');
        }
      }

      // Special handling for YouTube Mix/Radio playlists
      if (this.isRadioPlaylist(playlistId)) {
        // Extract the video ID from the playlist ID (for RD playlists)
        // Example: RD-U2skn6u2RA -> -U2skn6u2RA
        let videoId = playlistId.substring(2); // Remove 'RD' prefix
        
        // For RDMM prefixes, we need different handling
        if (playlistId.startsWith('RDMM')) {
          videoId = playlistId.substring(4); // Remove 'RDMM' prefix
        }
        
        // If no valid video ID found, use the first match
        if (!videoId || videoId.length < 11) {
          // Try to extract from original playlist ID using regex
          const videoMatch = playlistId.match(/[a-zA-Z0-9_-]{11}/);
          videoId = videoMatch ? videoMatch[0] : null;
          
          if (!videoId) {
            throw new Error('Could not extract video ID from radio playlist');
          }
        }
        
        // Get recommendations based on this video instead
        logger.info(`Using recommendations for Mix playlist with video ID: ${videoId}`);
        const recommendations = await this.youtubeAPI.getRecommendations(videoId);
        
        if (!recommendations || recommendations.length === 0) {
          throw new Error('Could not retrieve recommendations for the Mix playlist');
        }
        
        // Format recommendations to match song structure
        const songs = recommendations
          .slice(0, limit)
          .map(video => ({
            title: video.title || 'Unknown Title',
            url: `https://www.youtube.com/watch?v=${video.id}`,
            videoId: video.id,
            duration: this.formatDuration(video.duration?.seconds || 0),
            thumbnail: video.thumbnail?.[0]?.url || null,
            author: video.author?.name || 'Unknown'
          }));

        return songs;
      }

      // Standard playlist handling
      const playlist = await this.youtubeAPI.getPlaylist(playlistId);
      
      if (!playlist || !playlist.videos) {
        throw new Error('Could not retrieve playlist or it has no videos');
      }

      // Get up to the limit number of songs
      const songs = playlist.videos
        .slice(0, limit)
        .map(video => ({
          title: video.title || 'Unknown Title',
          url: `https://www.youtube.com/watch?v=${video.id}`,
          videoId: video.id,
          duration: this.formatDuration(video.duration?.seconds || 0),
          thumbnail: video.thumbnail?.[0]?.url || null,
          author: video.author?.name || 'Unknown'
        }));

      return songs;
    } catch (error) {
      logger.error('Error getting playlist songs:', error);
      throw error;
    }
  }

  /**
   * Stop playback and clear the queue
   * @param {string} guildId - Discord guild ID
   */
  stop(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      // const queue = this.getQueue(guildId);
      // queue.playing = false;
      // queue.textChannel.send({
      //   embeds: [Embed.notify('Stopped', 'Playback stopped.', TYPE.INFO)],
      // });
      player.stop();
      return true;
    }
    this.clearQueue(guildId);
    return false;
  }

  /**
   * Clear the song queue
   * @param {string} guildId - Discord guild ID
   */
  clearQueue(guildId) {
    const queue = this.getQueue(guildId);
    queue.songs = [];
    queue.playing = false;
  }

  /**
   * Toggle loop mode
   * @param {string} guildId - Discord guild ID
   * @returns {boolean} New loop state
   */
  toggleLoop(guildId) {
    const queue = this.getQueue(guildId);
    queue.loop = !queue.loop;
    return queue.loop;
  }

  /**
   * Set volume for playback
   * @param {string} guildId - Discord guild ID
   * @param {number} volume - Volume level (0-100)
   */
  setVolume(guildId, volume) {
    const queue = this.getQueue(guildId);
    const player = this.players.get(guildId);

    if (player && player.state.resource) {
      player.state.resource.volume.setVolume(volume / 100);
    }

    queue.volume = volume;
    return volume;
  }

  /**
   * Disconnect from voice and cleanup resources
   * @param {string} guildId - Discord guild ID
   */
  disconnect(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
    }

    this.players.delete(guildId);
    this.clearQueue(guildId);
  }

  /**
   * Get the voice channel the bot is in
   * @param {Guild} guild - Discord guild object
   * @returns {VoiceChannel} Voice channel object or null if not found
   */
  getVoiceChannel(guildId) {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      logger.warn(`Guild not found for ID: ${guildId}`);
      return null;
    }
    // Check if bot is in a voice channel
    let botVoiceChannel = null;
    const connection = this.connections.get(guildId);
    if (connection) {
      const channelId = connection.joinConfig.channelId;
      botVoiceChannel = guild.channels.cache.get(channelId);
    }
    // Check bot is in a voice channel
    if (!botVoiceChannel) {
      return null;
    }
    return botVoiceChannel;
  }

  /**
   * Search for songs on YouTube
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Search results
   */
  async searchSongs(query, limit = 5) {
    try {
      // Ensure we have a valid YouTube API instance
      if (!this.youtubeAPI) {
        logger.warn('YouTube API not initialized, trying to initialize now');
        await this.initialize();

        if (!this.youtubeAPI) {
          throw new Error('YouTube API could not be initialized');
        }
      }

      // Check if it looks like a YouTube URL
      const isYoutubeUrl = query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i);

      if (isYoutubeUrl) {
        // Get info for the video
        const videoId = this.extractVideoId(query);
        if (!videoId) {
          logger.error(`Could not extract video ID from URL: ${query}`);
          // Fall back to regular search instead of failing
          return this.performRegularSearch(query, limit);
        }

        try {
          const info = await this.youtubeAPI.getVideoInfo(videoId);
          return [{
            title: info.basic_info.title,
            url: query,
            videoId: videoId,
            duration: this.formatDuration(info.basic_info.duration),
            thumbnail: info.basic_info.thumbnail?.[0]?.url || null,
            author: info.basic_info.author
          }];
        } catch (urlError) {
          logger.error(`Error getting video info for URL: ${query}`, urlError);
          // Fall back to regular search on error
          return this.performRegularSearch(query, limit);
        }
      } else {
        // Regular search for non-URL queries
        return this.performRegularSearch(query, limit);
      }
    } catch (error) {
      logger.error('Error searching for songs:', error);
      throw error;
    }
  }

  /**
   * Perform a regular search for music tracks
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Search results
   */
  async performRegularSearch(query, limit = 5) {
    // Double-check API is available
    if (!this.youtubeAPI) {
      throw new Error('YouTube API not available');
    }

    try {
      const results = await this.youtubeAPI.search(query);

      // Ensure results is an array
      if (!Array.isArray(results)) {
        logger.warn(`YouTube API returned non-array results: ${typeof results}`);
        return [];
      }

      // Filter out any invalid items and format the valid ones
      const validResults = results
        .filter(item => !!item && typeof item === 'object')
        .map(item => {
          // Ensure all properties have fallback values
          const id = item.id || '';
          const title = typeof item.title === 'string' ? item.title :
            (item.title ? String(item.title) : 'Unknown Title');
          const duration = item.duration && typeof item.duration === 'object' ?
            (item.duration.seconds || 0) : 0;
          const thumbnail = item.thumbnail && Array.isArray(item.thumbnail) && item.thumbnail[0] ?
            item.thumbnail[0].url : null;
          const author = item.author && typeof item.author === 'object' ?
            (item.author.name || 'Unknown') : 'Unknown';

          return {
            title,
            url: `https://www.youtube.com/watch?v=${id}`,
            videoId: id,
            duration: this.formatDuration(duration),
            thumbnail,
            author
          };
        })
        .filter(item => item.videoId); // Only keep items with a valid videoId

      return validResults.slice(0, limit);
    } catch (error) {
      logger.error(`Error in performRegularSearch: ${error.message}`, error);
      // Return empty array instead of throwing to allow for more graceful failure
      return [];
    }
  }

  /**
   * Format duration in seconds to MM:SS format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    if (!seconds) return 'Unknown';

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Extract video ID from YouTube URL
   * @param {string} url - YouTube URL
   * @returns {string|null} Video ID or null if not found
   */
  extractVideoId(url) {
    if (!url) return null;

    // Match common YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i, // Standard URLs
      /^([a-zA-Z0-9_-]{11})$/ // Direct video IDs
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Clean up all connections when shutting down
   */
  async cleanup() {
    // Disconnect from all voice channels
    for (const [guildId, connection] of this.connections) {
      connection.destroy();
      logger.info(`Disconnected from voice in guild ${guildId}`);
    }

    this.connections.clear();
    this.players.clear();
    this.queues.clear();
  }


}
