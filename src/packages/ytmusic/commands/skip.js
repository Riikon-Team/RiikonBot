import logger from '../../../utils/logger.js';
import { TYPE, Embed } from '../utils/embed.js';

// Command configuration
export const config = {
  name: 'skip',
  description: 'Skip one or more songs in the queue',
  options: [
    {
      name: 'count',
      description: 'Number of songs to skip',
      type: 'NUMBER',
      required: false
    }
  ],
  category: 'Music'
};

// Command execution function
export async function execute(interaction, client) {
  await interaction.deferReply();
  
  const musicPlayer = client.getMusicPlayer();
  const guild = interaction.guild; 
  const voiceChannel = interaction.member.voice.channel;
  
  // Check if user is in a voice channel
  if (!voiceChannel) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'You need to be in a voice channel to skip songs!', TYPE.ERROR)]
    });
  }
 
  // Now safely access musicPlayer properties with additional checks
  if (!musicPlayer?.players || !musicPlayer?.players.has) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'Music player is not available.', TYPE.ERROR)]
    });
  }
  
  // Check if bot is playing in this guild
  if (!musicPlayer.players.has(guild.id)) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'I am not playing anything in this server!', TYPE.ERROR)]
    });
  }
  
  const botVoiceChannel = musicPlayer.getVoiceChannel(guild.id);
  // Check bot is in a voice channel
  if (!botVoiceChannel) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'I am not in a voice channel!', TYPE.ERROR)]
    });
  }

  // Check same voice channel
  if (botVoiceChannel && botVoiceChannel.id !== voiceChannel?.id) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'You need to be in the same voice channel as me to skip songs!', TYPE.ERROR)]
    });
  }
  
  // Safely get queue with checks
  let queue;
  try {
    queue = musicPlayer.getQueue(guild.id);
  } catch (error) {
    logger.error('Error getting queue:', error);
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'Failed to get the music queue.', TYPE.ERROR)]
    });
  }
  
  // Check if there are songs in the queue
  if (!queue || !queue.songs || queue.songs.length === 0) {
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'There are no songs to skip!', TYPE.ERROR)]
    });
  }
  
  // Parse skip count
  let skipCount = 1; // Default to 1
  const countOption = interaction.options.getNumber('count');
  if (countOption && countOption > 0) {
    skipCount = Math.floor(countOption); // Ensure it's an integer
  }
  
  // Make sure we're not trying to skip more songs than exist
  if (skipCount > queue.songs.length) {
    skipCount = queue.songs.length;
  }
  
  try {
    const queue = musicPlayer.getQueue(guild.id);
    queue.channel = interaction.channel; // Set the channel to the interaction channel

    const skipped = musicPlayer.skipSongs(guild.id, skipCount);
    if (skipped) {
      const skipMessage = skipCount === 1 
        ? 'Skipped the current song!' 
        : `Skipped ${skipCount} songs!`;
      
      return interaction.editReply({
        embeds: [Embed.notify('Success', skipMessage, TYPE.SUCCESS)]
      });
    } else {
      return interaction.editReply({
        embeds: [Embed.notify('Error', 'Failed to skip the song(s).', TYPE.ERROR)]
      });
    }
  } catch (error) {
    logger.error('Error skipping song(s):', error);
    return interaction.editReply({
      embeds: [Embed.notify('Error', 'An error occurred while trying to skip the song(s).', TYPE.ERROR)]
    });
  }
}
