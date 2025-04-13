import { TYPE, Embed } from '../utils/embed.js';

export const config = {
  name: 'playpl',
  aliases: ['playlist', 'pl'],
  description: 'Play a YouTube playlist (up to 20 songs)',
  usage: 'playpl <playlist URL>',
  category: 'music'
};

export async function execute(message, args, voiceChannel, musicPlayer) {
  const member = message.member;
  const guild = message.guild;
  const channel = message.channel;
  
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
    console.error('Error checking permissions:', error);
    hasPermission = false; // Assume no permission on error
  }
  
  if (!hasPermission) {
    return message.reply({
      embeds: [Embed.notify('Error', 'I need permission to connect and speak in your voice channel!', TYPE.ERROR)]
    });
  }
  
  // Check if we have a playlist URL
  if (args.length === 0) {
    return message.reply({
      embeds: [Embed.notify('Error', 'Please provide a YouTube playlist URL!', TYPE.ERROR)]
    });
  }
  
  const url = args[0];
  
  // Check if it's a valid YouTube playlist URL
  if (!url.includes('youtube.com') || !url.includes('list=')) {
    return message.reply({
      embeds: [Embed.notify('Error', 'Please provide a valid YouTube playlist URL!\nExample: https://www.youtube.com/playlist?list=PLAYLIST_ID', TYPE.ERROR)]
    });
  }
  
  try {
    // Send loading message
    const loadingMsg = await channel.send({
      embeds: [Embed.notify('Loading', `Loading playlist...`, TYPE.SEARCHING)]
    });
    
    // Extract playlist ID
    const playlistId = musicPlayer.extractPlaylistId(url);
    if (!playlistId) {
      return loadingMsg.edit({
        embeds: [Embed.notify('Error', 'Could not extract playlist ID from the URL.', TYPE.ERROR)]
      });
    }
    
    // Check if it's a Mix/Radio playlist and inform the user
    const isMixPlaylist = musicPlayer.isRadioPlaylist(playlistId);
    if (isMixPlaylist) {
      await loadingMsg.edit({
        embeds: [Embed.notify('Loading', 'Detected a YouTube Mix playlist. Loading recommended songs...', TYPE.SEARCHING)]
      });
    }
    
    // Get songs from playlist (limited to 20)
    const songs = await musicPlayer.getPlaylistSongs(playlistId, 20);
    
    if (!songs || songs.length === 0) {
      return loadingMsg.edit({
        embeds: [Embed.notify('Error', 'No songs found in the playlist or the playlist is private.', TYPE.ERROR)]
      });
    }
    
    // Try to join voice channel
    let joinSuccess = false;
    try {
      if (!musicPlayer.connections.has(guild.id)) {
        joinSuccess = await musicPlayer.joinChannel(voiceChannel, channel);
        if (!joinSuccess) {
          return loadingMsg.edit({
            embeds: [Embed.notify('Error', 'Could not join the voice channel.', TYPE.ERROR)]
          });
        }
      } else {
        joinSuccess = true;
      }
    } catch (joinError) {
      console.error('Error joining channel:', joinError);
      return loadingMsg.edit({
        embeds: [Embed.notify('Error', `Error joining channel: ${joinError.message}`, TYPE.ERROR)]
      });
    }
    
    // Add songs to queue
    let addedCount = 0;
    for (const song of songs) {
      try {
        musicPlayer.addToQueue(guild.id, song, member?.displayName);
        addedCount++;
      } catch (error) {
        console.error('Error adding song to queue:', error);
        // Continue with next song instead of failing the whole playlist
      }
    }
    
    if (addedCount === 0) {
      return loadingMsg.edit({
        embeds: [Embed.notify('Error', 'Failed to add any songs to the queue.', TYPE.ERROR)]
      });
    }
    
    return loadingMsg.edit({
      embeds: [Embed.notify('Success', `Added ${addedCount} songs from the playlist to the queue!`, TYPE.SUCCESS)]
    });
    
  } catch (error) {
    console.error('Error loading playlist:', error);
    return message.reply({
      embeds: [Embed.notify('Error', `Error loading playlist: ${error.message}`, TYPE.ERROR)]
    });
  }
}
