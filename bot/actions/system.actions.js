import { iEmbedBuilder } from '../utils/iEmbedBuilder.js';
import { PROJECT_INFO, E } from '../constants/bot.js';
import { ReplyBuilder } from '../utils/replyBuilder.js';

// Ping command
export const pingAction = async (ctx) => {
    try {
        const embed = new iEmbedBuilder(ctx)
            .setTitle('Pong! 🏓')
            .setDescription(`Delay: ${Date.now() - ctx.source.createdTimestamp}ms`)
            .setColor('#0099ff')
            .setTimestamp();
        return ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Ping command error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
};

// Get avatar of a user command
export const getAvatarAction = async (ctx, { user, fullSize = true }) => {
    try {
        if (!user) user = ctx.author;
        const embed = new iEmbedBuilder(ctx)
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: fullSize ? 4096 : 512 }))
            .setColor('#0099ff')
            .setTimestamp();
        return ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Avatar command error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
};

// Get guild info command
export const getGuildInfoAction = async (ctx) => {
    const { guild } = ctx;
    try {
        if (guild) {
            const embed = new iEmbedBuilder(ctx)
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
                .setTimestamp();
            return ctx.reply({ embeds: [embed] });
        }
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Không thể lấy thông tin server.')] });
    } catch (error) {
        console.error('Server Info command error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
};

// Get about me command
export const getAboutMeAction = async (ctx) => {
    try {
        const embed = new iEmbedBuilder(ctx)
            .setTitle('Giới thiệu bản thân 🤖')
            .setDescription(`Xin chào! Mình là **${ctx.client.user.displayName || ctx.client.user.username}**, một bot Discord đa năng được phát triển để giúp quản lý server và mang lại trải nghiệm giải trí cho người dùng.`)
            .addFields(
                { name: 'Phiên bản', value: PROJECT_INFO.version, inline: true },
                { name: 'Ngôn ngữ lập trình', value: PROJECT_INFO.language, inline: true },
                { name: 'Tạo bởi', value: PROJECT_INFO.author, inline: true },
                { name: 'GitHub', value: `[${PROJECT_INFO.name}](${PROJECT_INFO.repositoryUrl})`, inline: true },
                { name: 'Giấy phép', value: PROJECT_INFO.license, inline: true },
                { name: 'Hỗ trợ', value: `[Link](${PROJECT_INFO.issueTracker})`, inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();
        return ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('About Me command error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
};

// Get profile of a user command
export const getProfileAction = async (ctx, { user }) => {
    try {
        if (!user) user = ctx.author;
        if (user) {

            const embed = new iEmbedBuilder(ctx)
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
                .setTimestamp();
            return ctx.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Profile command error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
};
// Get voice channel users
export const getVoiceUsersAction = async (ctx) => {
    const { member, guild } = ctx;

    try {
        // Get the voice channel the user is in
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Bạn cần vào một kênh voice để sử dụng lệnh này!');

            return ctx.reply({ embeds: [embed] });
        }

        // Get all members in the voice channel
        const members = voiceChannel.members;

        if (members.size === 0) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff9900')
                .setTitle(`${E.warning} Thông báo`)
                .setDescription(`Không có ai trong kênh voice **${voiceChannel.name}**`);

            return ctx.reply({ embeds: [embed] });
        }

        // Build user list with display name and highest role
        let userList = '';
        const userArray = [];

        for (const [memberId, voiceMember] of members) {
            try {
                // Get member from guild to access roles
                const guildMember = await guild.members.fetch(memberId);

                // Get highest role (excluding @everyone)
                const highestRole = guildMember.roles.highest.name !== '@everyone'
                    ? guildMember.roles.highest.name
                    : 'Không có role';

                const displayName = guildMember.displayName || guildMember.user.username;
                const formattedName = `[${highestRole}] ${displayName}`;

                userArray.push({
                    name: formattedName,
                    displayName,
                    tag: guildMember.user.tag,
                    role: highestRole
                });

                userList += `• **${formattedName}** (@${guildMember.user.tag})\n`;
            } catch (error) {
                console.error(`Error fetching member ${memberId}:`, error);
            }
        }

        // Create embed
        const embed = new iEmbedBuilder(ctx)
            .setColor('#0099ff')
            .setTitle(`👥 Danh sách người dùng trong voice`)
            .setDescription(
                `**Kênh:** ${voiceChannel.name}\n` +
                `**Số người:** ${members.size}\n\n` +
                `${userList}`
            )
            .setFooter({ text: `Format: [Role cao nhất] Tên hiển thị` })
            .setTimestamp();

        return ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Get voice users error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
};

// Get help command
export const helpAction = async (ctx, { helpDocs, type = 'slash', page = 1 }) => {
    // Validate input
    if (type !== 'prefix' && type !== 'slash') {
        return ctx.reply({
            embeds: [ReplyBuilder.error('Lỗi', 'Loại lệnh không hợp lệ. Vui lòng sử dụng "prefix" hoặc "slash".')]
        });
    }

    if (Number.isNaN(page) || page < 1) {
        return ctx.reply({
            embeds: [ReplyBuilder.error('Lỗi', 'Vui lòng cung cấp số trang hợp lệ.')]
        });
    }

    try {
        const limit = 15;
        const helpData = type === 'slash' ? helpDocs.commands : helpDocs.prefixCommands;
        const totalPages = Math.ceil(helpData.commands.length / limit);
        if (page < 1 || page > totalPages) {
            return ctx.reply({
                embeds: [ReplyBuilder.error('Lỗi', `Trang không hợp lệ. Vui lòng chọn trang từ 1 đến ${totalPages}.`)]
            });
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const commandsToShow = helpData.commands.slice(start, end);

        const embed = new iEmbedBuilder(ctx)
            .setTitle(helpData.title)
            .setDescription(`Trang ${page} trên ${totalPages}`)
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: type === 'slash' ? `/${ctx.commandName}` : `${helpData.prefix}${ctx.commandName}` });

        for (const cmd of commandsToShow) {
            embed.addFields({ name: cmd.name, value: cmd.description });
        }

        return ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Help command error:', error);
        return ctx.reply({ embeds: [ReplyBuilder.error('Lỗi', 'Đã có lỗi xảy ra khi thực hiện lệnh.')] });
    }
}