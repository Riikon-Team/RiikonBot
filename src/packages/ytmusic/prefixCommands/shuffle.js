import { TYPE, Embed } from '../utils/embed.js';

export const config = {
  name: 'shuffle',
  aliases: ['mix', 'random'],
  description: 'Shuffle songs in the current queue',
  usage: 'shuffle',
  category: 'music'
};

export async function execute(message, args, voiceChannel, musicPlayer) {
  const guild = message.guild;
 
  // Now safely access musicPlayer properties with additional checks
  if (!musicPlayer?.players || !musicPlayer?.players.has) {
    return message.reply({
      embeds: [Embed.notify('Error', 'Music player is not available.', TYPE.ERROR)]
    });
  } 
  
  // Check if bot is playing in this guild
  if (!musicPlayer.players.has(guild.id)) {
    return message.reply({
      embeds: [Embed.notify('Error', 'I am not playing anything in this server!', TYPE.ERROR)]
    });
  }
   
  const botVoiceChannel = musicPlayer.getVoiceChannel(guild.id);
  // Check bot is in a voice channel
  if (!botVoiceChannel) {
    return message.reply({
      embeds: [Embed.notify('Error', 'I am not in a voice channel!', TYPE.ERROR)]
    });
  }

  // Check same voice channel
  if (botVoiceChannel && botVoiceChannel.id !== voiceChannel?.id) {
    return message.reply({
      embeds: [Embed.notify('Error', 'You need to be in the same voice channel as me to shuffle the queue!', TYPE.ERROR)]
    });
  }
  
  // Safely get queue with checks
  let queue;
  try {
    queue = musicPlayer.getQueue(guild.id);
  } catch (error) {
    console.error('Error getting queue:', error);
    return message.reply({
      embeds: [Embed.notify('Error', 'Failed to get the music queue.', TYPE.ERROR)]
    });
  }
  
  // Check if there are enough songs to shuffle
  if (!queue || !queue.songs || queue.songs.length <= 2) {
    return message.reply({
      embeds: [Embed.notify('Error', 'Need at least 3 songs in the queue to shuffle!', TYPE.ERROR)]
    });
  }
  
  try {
    const shuffledCount = musicPlayer.shuffleQueue(guild.id);
    
    return message.reply({
      embeds: [Embed.notify('Shuffled', `Successfully shuffled ${shuffledCount} songs in the queue!`, TYPE.SUCCESS)]
    });
  } catch (error) {
    console.error('Error shuffling queue:', error);
    return message.reply({
      embeds: [Embed.notify('Error', 'An error occurred while trying to shuffle the queue.', TYPE.ERROR)]
    });
  }
}
