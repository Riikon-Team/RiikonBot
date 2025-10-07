import { Events, EmbedBuilder } from 'discord.js';
import { E } from '../constants/bot.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const client = newState.client;
        const guild = newState.guild;
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        if (newState.member.user.bot) return;

        const player = client.musicPlayers?.get(guild.id);

        if (!oldState.channel && newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`👋 **<@!${newState.member.id}> vừa vào kênh <#${newChannel.id}>**`)

            newChannel.send({ embeds: [embed] }).catch(console.error);

            if (player && newState.channel.id === player.voiceChannel?.id) {
                player.resetIdleTimeout();
            }
        }

        if (oldState.channel && !newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`${E.exit} **<@!${oldState.member.id}> đã rời kênh <#${oldChannel.id}>**`)
            oldState.channel.send({ embeds: [embed] }).catch(console.error);

            if (player && oldState.channel.id === player.voiceChannel?.id) {
                const members = oldState.channel.members.filter(m => !m.user.bot);
                if (members.size === 0 && player.connection) {
                    const textCh = player.textChannel || textChannel;
                    if (textCh) {
                        const aloneEmbed = new EmbedBuilder()
                            .setColor('#ff9900')
                            .setTitle('Không còn ai trong kênh')
                            .setDescription('Bot sẽ rời kênh sau 1 phút nếu không có ai quay lại')
                            .setTimestamp();
                        
                        textCh.send({ embeds: [aloneEmbed] }).catch(console.error);
                    }
                    player.startIdleTimeout();
                }
            }
        }

        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const embedIncome = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`${E.exit} **<@!${oldState.member.id}> đã chuyển sang kênh khác rồi!**`)

            const embedOutcome = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`👋 **<@!${newState.member.id}> vừa vào kênh <#${newChannel.id}>**`)

            oldChannel.send({ embeds: [embedIncome] }).catch(console.error);
            newChannel.send({ embeds: [embedOutcome] }).catch(console.error);

            if (player) {
                if (oldState.channel.id === player.voiceChannel?.id) {
                    const members = oldState.channel.members.filter(m => !m.user.bot);
                    if (members.size === 0 && player.connection) {
                        const textCh = player.textChannel || oldTextChannel;
                        if (textCh) {
                            const aloneEmbed = new EmbedBuilder()
                                .setColor('#ff9900')
                                .setTitle('Không còn ai trong kênh')
                                .setDescription('Bot sẽ rời kênh sau 1 phút nếu không có ai quay lại')
                                .setTimestamp();
                            
                            textCh.send({ embeds: [aloneEmbed] }).catch(console.error);
                        }
                        player.startIdleTimeout();
                    }
                }
                
                if (newState.channel.id === player.voiceChannel?.id) {
                    player.resetIdleTimeout();
                }
            }
        }
    }
};
