import { Innertube } from 'youtubei.js';

class YouTubeAPI {
  constructor() {
    this.innertube = null;
  }

  async initialize() {
    this.innertube = await Innertube.create({ 
      gl: 'VN',
      hl: 'vi',
      generate_session_locally: true, 
    });
    return this;
  }

  /**
   * Search for content with type filtering
   * @param {string} query - Search query
   * @param {string} filterType - 'music', 'video', or 'mixed'
   * @returns {Promise<Array>} Search results
   */
  async search(query, filterType = 'mixed') {
    try {
      // Connect to YouTube if needed
      if (!this.innertube) {
        await this.initialize();
      }
      
      // Search YouTube
      const searchResults = await this.innertube.search(query);
      
      // Filter results based on content type
      let results = [];
      
      if (searchResults) {
        try {
          if (typeof searchResults.selectType === 'function') {
            console.log(`Using selectType for ${filterType} content`);
            // If filterType is 'mixed', we don't apply specific filtering
            if (filterType === 'mixed') {
              results = searchResults.results || [];
            } else {
              const filteredResults = await searchResults.selectType(filterType);
              results = filteredResults.results || [];
            }
          } else {
            console.log(`selectType not available, using manual filtering for ${filterType}`);
            // If filterType is 'mixed', we don't apply filtering
            if (filterType === 'mixed') {
              results = searchResults.results || [];
            } else {
              // Manual filtering based on result type
              results = (searchResults.results || []).filter(item => {
                if (!item) return false;
                
                // Safely handle different types for itemType and itemTitle
                const itemType = item.type ? String(item.type).toLowerCase() : '';
                
                // Handle title safely - ensure it's a string before calling toLowerCase
                let itemTitle = '';
                if (item.title) {
                  itemTitle = typeof item.title === 'string' 
                    ? item.title.toLowerCase() 
                    : String(item.title).toLowerCase();
                }
                
                // Safely handle author
                let authorName = '';
                if (item.author && item.author.name) {
                  authorName = typeof item.author.name === 'string'
                    ? item.author.name.toLowerCase()
                    : String(item.author.name).toLowerCase();
                }
                
                if (filterType === 'music') {
                  return itemType.includes('song') || 
                        itemType.includes('music') || 
                        itemType.includes('album') ||
                        itemTitle.includes('official audio') ||
                        authorName.includes('music') ||
                        authorName.includes('vevo');
                } else if (filterType === 'video') {
                  return itemType.includes('video') && 
                        !itemType.includes('music') &&
                        !itemTitle.includes('official audio');
                }
                
                return true; // Should not reach here as we handle 'mixed' separately
              });
            }
          }
        } catch (filterError) {
          console.warn(`Error filtering ${filterType} results:`, filterError);
          // If filtering fails, return unfiltered results
          results = searchResults.results || [];
        }
      }
      
      // Process results to normalize format and handle missing data
      return results.map(item => ({
        id: item.id || '',
        title: item.title || 'Unknown Title',
        description: item.description || '',
        author: item.author ? {
          name: item.author.name || 'Unknown Artist',
          id: item.author.id || ''
        } : { name: 'Unknown Artist', id: '' },
        viewCount: item.view_count || item.viewCount || 0,
        duration: item.duration || { seconds: 0, text: 'Unknown' },
        thumbnail: Array.isArray(item.thumbnail) ? item.thumbnail : 
                  (item.thumbnails?.[0] ? [item.thumbnails[0]] : []),
        type: item.type || 'Unknown'
      }));
    } catch (error) {
      console.error('YouTube API search error:', error);
      return []; // Return empty array instead of throwing to make the app more resilient
    }
  }

  /**
   * Search for music only
   * @param {string} query - Search query
   * @returns {Promise<Array>} Music search results
   */
  async searchMusic(query) {
    return this.search(query, 'music');
  }

  /**
   * Search for videos only
   * @param {string} query - Search query
   * @returns {Promise<Array>} Video search results
   */
  async searchVideos(query) {
    return this.search(query, 'video');
  }

  /**
   * Get detailed information about a video
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video information
   */
  async getVideoInfo(videoId) {
    try {
      return await this.innertube.getInfo(videoId);
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }

  /**
   * Get playlist contents
   * @param {string} playlistIdOrUrl - Playlist ID or URL
   * @returns {Promise<Object>} Playlist information and videos
   */
  async getPlaylist(playlistIdOrUrl) {
    try {
      // Extract playlist ID if URL is provided
      const playlistId = playlistIdOrUrl.includes('list=') 
        ? playlistIdOrUrl.split('list=')[1].split('&')[0] 
        : playlistIdOrUrl;
      
      return await this.innertube.getPlaylist(playlistId);
    } catch (error) {
      console.error('Get playlist error:', error);
      throw error;
    }
  }

  /**
   * Get video recommendations for a video
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Array>} Related videos
   */
  async getRecommendations(videoId) {
    try {
      const info = await this.getVideoInfo(videoId);
      
      // Check for related_videos and try multiple fallback methods
      let recommendations = [];
      
      // Try related_videos first
      if (info.related_videos && Array.isArray(info.related_videos) && info.related_videos.length > 0) {
        recommendations = info.related_videos;
      } 
      // Try getUpNext method if available
      else if (typeof info.getUpNext === 'function') {
        try {
          const upNext = await info.getUpNext();
          if (upNext && Array.isArray(upNext) && upNext.length > 0) {
            recommendations = upNext;
          }
        } catch (upNextError) {
          console.warn('Failed to get upNext recommendations:', upNextError);
        }
      }
      
      // If still no recommendations, try to search for similar content
      if (recommendations.length === 0 && info.basic_info && info.basic_info.title) {
        try {
          // Use the title to search for similar content
          const searchQuery = info.basic_info.author ? 
            `${info.basic_info.author.name} ${info.basic_info.title}` : 
            info.basic_info.title;
          
          console.log(`No recommendations found, searching for: ${searchQuery}`);
          const searchResults = await this.search(searchQuery, 'mixed');
          
          // Filter out the original video
          recommendations = searchResults.filter(item => item.id !== videoId);
        } catch (searchError) {
          console.warn('Failed to get search-based recommendations:', searchError);
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Get recommendations error:', error);
      return []; // Return empty array instead of throwing to prevent cascading failures
    }
  }

  /**
   * Get the next videos in autoplay sequence
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Array>} Next videos
   */
  async getNextVideos(videoId) {
    try {
      const info = await this.getVideoInfo(videoId);
      
      // Try getUpNext first, then fall back to related videos
      if (typeof info.getUpNext === 'function') {
        try {
          const upNext = await info.getUpNext();
          if (upNext && Array.isArray(upNext) && upNext.length > 0) {
            return upNext;
          }
        } catch (upNextError) {
          console.warn('Failed to get upNext:', upNextError);
        }
      }
      
      // Fall back to related videos
      return info.related_videos && Array.isArray(info.related_videos) ? 
        info.related_videos : [];
    } catch (error) {
      console.error('Get next videos error:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Find the audio-only version of a music video
   * @param {string} videoId - YouTube music video ID
   * @returns {Promise<Object|null>} Audio version or null if not found
   */
  async getAudioVersion(videoId) {
    try {
      const info = await this.getVideoInfo(videoId);
      const title = info.basic_info.title;
      const artist = info.basic_info.author;
      
      // Search for audio version using artist + title
      const searchQuery = `${artist} ${title}`;
      const searchResults = await this.search(searchQuery, 'music');
      
      // Find the song version (usually the first "Song" or "Audio" result)
      const audioVersion = searchResults.find(result => {
        // Check if it's a Song type or has audio attributes
        if (result.type === 'Song') return true;
        
        // Check if it matches title but doesn't have video indicators
        const lowerTitle = result.title.toLowerCase();
        return lowerTitle.includes(title.toLowerCase()) && 
               !lowerTitle.includes('video') &&
               !lowerTitle.includes('mv') &&
               !lowerTitle.includes('official video');
      });
      
      return audioVersion || null;
    } catch (error) {
      console.error('Get audio version error:', error);
      throw error;
    }
  }

  /**
   * Get streaming URL for a video
   * @param {string} videoId - YouTube video ID
   * @param {string} format - 'audio' or 'video'
   * @returns {Promise<string>} Streaming URL
   */
  async getStreamURL(videoId, format = 'audio') {
    try {
      const info = await this.getVideoInfo(videoId);
      const streamingData = format === 'audio' 
        ? await info.chooseFormat({ type: 'audio' })
        : await info.chooseFormat({ type: 'video' });
      
      return streamingData.url;
    } catch (error) {
      console.error('Get stream URL error:', error);
      throw error;
    }
  }

  // /** 
  //  * 
  //  * @param {String} videoId 
  //  * @returns 
  //  */
  // async getLyrics(videoId) {
  //   try {
  //     const info = await this.getVideoInfo(videoId);
  //     const lyrics = info.lyrics || null;
  //     return lyrics;
  //   } catch (error) {
  //     console.error('Get lyrics error:', error);
  //     throw error;
  //   }
  // }
}

// Export as singleton
let instance;
export async function getYouTubeAPI() {
  if (!instance) {
    instance = await new YouTubeAPI().initialize();
  }
  return instance;
}

// For direct usage in tests or specific scenarios
export default YouTubeAPI;
