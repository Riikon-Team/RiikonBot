import logger from '../../../utils/logger.js';
import { EmbedBuilder } from "discord.js";
/**
 * Handles the voiceStateUpdate event.
 * @param {import('discord.js').VoiceState} oldState The old voice state.
 * @param {import('discord.js').VoiceState} newState The new voice state.
 */
export function handleVoiceStateUpdate(oldState, newState) {
  const member = newState.member || oldState.member;
  if (member.user.bot) return; 

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;
  const guild = newState.guild;

  if (!oldChannel && newChannel) {
    newChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Voice Channel Join")
          .setDescription(`${member.user.tag} joined the voice **${newChannel.name}** channel.`)
          .setColor("Green")
      ]
    });

    logger.info(`[${guild.name}] ${member.user.tag} joined voice channel: ${newChannel.name}`);
  } else if (oldChannel && !newChannel) {
    oldChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Voice Channel Leave")
          .setDescription(`${member.user.tag} left the voice **${oldChannel.name}** channel.`)
          .setColor("Red")
      ]
    });

    logger.info(`[${guild.name}] ${member.user.tag} left voice channel: ${oldChannel.name}`);
  } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    logger.info(`[${guild.name}] ${member.user.tag} moved from ${oldChannel.name} to ${newChannel.name}`);
  }
}