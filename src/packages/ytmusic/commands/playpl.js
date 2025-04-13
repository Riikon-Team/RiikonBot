import logger from '../../../utils/logger.js';
import { TYPE, Embed } from '../utils/embed.js';

// Command configuration
export const config = {
  name: 'playpl',
  description: 'Play a YouTube playlist (up to 20 songs)',
  options: [
    {
      name: 'url',
      description: 'YouTube playlist URL',
      type: 'STRING',
      required: true
    }
  ],
  category: 'Music'
};

// Command execution function
export async function execute(interaction, client) {
  await interaction.deferReply();
  
  const musicPlayer = client.getMusicPlayer();
  const voiceChannel = interaction.member.voice.channel;
  const url = interaction.options.getString('url');
  const guild = interaction.guild;
  
  // Check if user is in a voice channel
  if (!voiceChannel) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'You need to be in a voice channel to play music!', TYPE.ERROR)]
    });
  }

  // Check bot permissions with robust null checking
  let hasPermission = true;
  try {
    // Make sure guild.me exists
    if (guild.me) {
      const permissions = voiceChannel.permissionsFor(guild.me);
      // Only check .has() if permissions is not null
      if (permissions) {
        hasPermission = permissions.has('CONNECT') && permissions.has('SPEAK');
      }
    }
  } catch (error) {
    logger.error('Error checking permissions:', error);
    hasPermission = false; // Assume no permission on error
  }

  if (!hasPermission) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'I need permission to connect and speak in your voice channel!', TYPE.ERROR)]
    });
  }
  
  // Check if it's a valid YouTube playlist URL
  if (!url.includes('youtube.com') || !url.includes('list=')) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'Please provide a valid YouTube playlist URL!\nExample: https://www.youtube.com/playlist?list=PLAYLIST_ID', TYPE.ERROR)]
    });
  }

  try {
    // Update status message
    await interaction.editReply({
      embeds: [Embed.notify('Loading', 'Loading playlist...', TYPE.SEARCHING)]
    });
    
    // Extract playlist ID
    const playlistId = musicPlayer.extractPlaylistId(url);
    if (!playlistId) {
      return interaction.editReply({
        embeds: [Embed.notify('Error', 'Could not extract playlist ID from the URL.', TYPE.ERROR)]
      });
    }
    
    // Check if it's a Mix/Radio playlist and inform the user
    const isMixPlaylist = musicPlayer.isRadioPlaylist(playlistId);
    if (isMixPlaylist) {
      await interaction.editReply({
        embeds: [Embed.notify('Loading', 'Detected a YouTube Mix playlist. Loading recommended songs...', TYPE.SEARCHING)]
      });
    }
    
    // Get songs from playlist (limited to 20)
    const songs = await musicPlayer.getPlaylistSongs(playlistId, 20);
    
    if (!songs || songs.length === 0) {
      return interaction.editReply({
        embeds: [Embed.notify('Error', 'No songs found in the playlist or the playlist is private.', TYPE.ERROR)]
      });
    }
    
    // Try to join voice channel
    let joinSuccess = false;
    try {
      if (!musicPlayer.connections.has(guild.id)) {
        joinSuccess = await musicPlayer.joinChannel(voiceChannel, interaction.channel);
        if (!joinSuccess) {
          return interaction.editReply({
            embeds: [Embed.notify('Error', 'Could not join the voice channel.', TYPE.ERROR)]
          });
        }
      } else {
        joinSuccess = true;
      }
    } catch (joinError) {
      logger.error('Error joining channel:', joinError);
      return interaction.editReply({
        embeds: [Embed.notify('Error', `Error joining channel: ${joinError.message}`, TYPE.ERROR)]
      });
    }
    
    // Add songs to queue
    let addedCount = 0;
    for (const song of songs) {
      try {
        musicPlayer.addToQueue(guild.id, song, interaction.member?.displayName);
        addedCount++;
      } catch (error) {
        logger.error('Error adding song to queue:', error);
        // Continue with next song instead of failing the whole playlist
      }
    }
    
    if (addedCount === 0) {
      return interaction.editReply({
        embeds: [Embed.notify('Error', 'Failed to add any songs to the queue.', TYPE.ERROR)]
      });
    }
    
    return interaction.editReply({
      embeds: [Embed.notify('Success', `Added ${addedCount} songs from the playlist to the queue!`, TYPE.SUCCESS)]
    });
    
  } catch (error) {
    logger.error('Error loading playlist:', error);
    return interaction.editReply({
      embeds: [Embed.notify('Error', `Error loading playlist: ${error.message}`, TYPE.ERROR)]
    });
  }
}
