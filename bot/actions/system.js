import { EmbedBuilder } from 'discord.js';
import { PROJECT_INFO } from '../constants/bot.js';

export const pingAction = (commandName, message) => {
    const embed = new EmbedBuilder()
        .setTitle('Pong! 🏓')
        .setDescription(`Delay: ${Date.now() - message.createdTimestamp}ms`)
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({ text: commandName? `/${commandName}` : 'Ping Command' });
    return { embeds: [embed] };
};

export const getAvatarAction = (commandName, user, fullSize = false) => {
    if (user) {
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: fullSize ? 4096 : 1024 });
        const embed = new EmbedBuilder()
            .setTitle(`${user.displayName || user.username}'s Avatar`)
            .setImage(avatarUrl)
            .setColor('#0099ff')
            .setURL(avatarUrl)
            .setTimestamp()
            .setFooter({ text: `${commandName? `/${commandName}` : 'Avatar Command'}` });
        return { embeds: [embed] };
    }
    return { content: 'User not found.' };
};

export const getGuildInfoAction = (commandName, guild) => {
    if (guild) {
        const embed = new EmbedBuilder()
            .setTitle(`Giới thiệu về server: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Chủ sở hữu', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Số lượng thành viên', value: `${guild.memberCount}`, inline: true },
                { name: 'Số lượng kênh', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Số lượng vai trò', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Số lượng emoji', value: `${guild.emojis.cache.size}`, inline: true },
                { name: 'Số lượng sticker', value: `${guild.stickers.cache.size}`, inline: true },
                { name: 'Cấp độ xác minh', value: `${guild.verificationLevel}`, inline: true },
                { name: 'Số lượt boost', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Cấp độ boost', value: `Tier ${guild.premiumTier}`, inline: true },
                { name: 'Ngày tạo', value: guild.createdAt.toDateString(), inline: true },
                { name: 'Khu vực', value: guild.preferredLocale || 'Unknown', inline: true },
            )
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: `${commandName? `/${commandName}` : 'Server Info Command'}` });
        return { embeds: [embed] };
    }
    return { content: 'Không tìm thấy server.' };
};

export const getAboutMeAction = (commandName, client) => {
    const embed = new EmbedBuilder()
        .setTitle('Giới thiệu bản thân 🤖')
        .setDescription('Mình là một bot Discord được phát triển để hỗ trợ quản lý server và cung cấp các tính năng thú vị cho người dùng.')
        .addFields(
            { name: 'Phiên bản', value: PROJECT_INFO.version, inline: true },
            { name: 'Ngôn ngữ lập trình', value: PROJECT_INFO.language, inline: true },
            { name: 'Tạo bởi', value: PROJECT_INFO.author, inline: true },
            { name: 'GitHub', value: `[${PROJECT_INFO.name}](${PROJECT_INFO.repositoryUrl})`, inline: true },
            { name: 'Giấy phép', value: PROJECT_INFO.license, inline: true },
            { name: 'Hỗ trợ', value: `[Link](${PROJECT_INFO.issueTracker})`, inline: true }
        )
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({ text: `${commandName? `/${commandName}` : 'About Me Command'}` });
    return { embeds: [embed] };
};

export const getProfileAction = (commandName, user) => {
    if (user) {
        console.log(user);
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Profile`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'Tên hiển thị', value: user.displayName || user.username, inline: true },
                { name: 'Username', value: `||${user.username}||`, inline: true },
                { name: 'ID', value: `||${user.id}||`, inline: true },
                { name: 'Là bot', value: user.bot ? 'Có' : 'Không', inline: true },
                { name: 'Ngày tạo', value: user.createdAt.toDateString(), inline: true },
            )
            .setURL(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: `${commandName? `/${commandName}` : 'Profile Command'}` });
        return { embeds: [embed] };
    }
    return { content: 'User not found.' };
};

// Trả về Embed, có phân trang. Type = 'slash' hoặc 'prefix'. 
export const helpAction = (commandName, helpDocs, type = 'slash', page = 1) => {
    const limit = 15;
    const helpData = type === 'slash' ? helpDocs.commands : helpDocs.prefixCommands;
    const totalPages = Math.ceil(helpData.commands.length / limit);
    if (page < 1 || page > totalPages) {
        return { content: `Trang không hợp lệ. Vui lòng chọn trang từ 1 đến ${totalPages}.` };
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const commandsToShow = helpData.commands.slice(start, end);

    const embed = new EmbedBuilder()
        .setTitle(helpData.title)
        .setDescription(`Trang ${page} trên ${totalPages}`)
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({ text: type === 'slash' ? `/${commandName}` : `${helpData.prefix}${commandName}` });

    commandsToShow.forEach(cmd => {
        embed.addFields({ name: cmd.name, value: cmd.description });
    });

    return { embeds: [embed]};
}