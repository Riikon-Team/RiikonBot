import { DISCORD_VOICE_REGIONS } from "../constants/bot.js";
import { EmbedBuilder } from "discord.js";

export const GuildInfo = {
    data: {
        name: 'GuildInfo',
        description: 'Fetch Discord guild information by ID',
        parameters: [
            {
                name: 'guildId',
                type: 'string',
                description: {
                    "vi": "Hàm sử dụng để lấy thông tin về máy chủ Discord dựa trên ID của nó",
                    "en": "Function used to retrieve information about a Discord server based on its ID"
                },
                required: true,
            },
        ],
        returns: { type: 'object', description: 'An object containing guild information' },
    },
    async execute(client, interaction, guildId) {
        try {
            const guild = await client.guilds.fetch(guildId);
            if (!guild) return null;

            return {
                guildName: guild.name,
                memberCount: guild.memberCount,
                region: guild.region,
                ownerId: guild.ownerId,
                owner: guild.owner ? guild.owner.user.tag : 'Unknown',
                createdAt: guild.createdAt,
                joinedAt: guild.joinedAt,
                // roles: guild.roles.cache.map(role => role.name).join(', '),
                numberRoles: guild.roles.cache.size,
                // channels: guild.channels.cache.map(channel => channel.name).join(', '),
                numberChannels: guild.channels.cache.size,
                numberEmojis: guild.emojis.cache.size,
                numberStickers: guild.stickers.cache.size,
                verificationLevel: guild.verificationLevel,
                boostCount: guild.premiumSubscriptionCount,
                boostTier: guild.premiumTier,
            };
        } catch (error) {
            console.error('Error fetching guild info:', error);
            return null;
        }
    }
};

export const UserInfo = {
    data: {
        name: 'UserInfo',
        description: 'Fetch Discord user information by ID',
        parameters: [
            {
                name: 'userId',
                type: 'string',
                description: {
                    "vi": "Hàm sử dụng để lấy thông tin về người dùng Discord dựa trên ID của họ",
                    "en": "Function used to retrieve information about a Discord user based on their ID"
                },
                required: true,
            },
        ],
        returns: { type: 'object', description: 'An object containing user information' },
    },
    async execute(client, interaction, userId) {
        try {
            const user = await client.users.fetch(userId);
            if (!user) return null;

            return {
                username: user.tag,
                id: user.id,
                bot: user.bot,
                createdAt: user.createdAt,
                // mutualGuilds: client.guilds.cache.filter(g => g.members.cache.has(user.id)).map(g => g.name).join(', '),
                mutualGuildsCount: client.guilds.cache.filter(g => g.members.cache.has(user.id)).size,
                avatar: user.displayAvatarURL({ dynamic: true, size: 512 }),
            };
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    }
};

export const UserPresence = {
    data: {
        name: 'UserPresence',
        description: 'Fetch Discord user presence information by ID',
        parameters: [
            {
                name: 'userId',
                type: 'string',
                description: {
                    "vi": "Hàm sử dụng để lấy thông tin về trạng thái hiện diện của người dùng Discord dựa trên ID của họ",
                    "en": "Function used to retrieve information about a Discord user's presence status based on their ID"
                },
                required: true,
            },
        ],
        returns: { type: 'object', description: 'An object containing user presence information' },
    },
    async execute(client, interaction, userId) {
        try {
            let presenceInfo = null;
            const guild = await client.guilds.fetch(interaction.guildId);
            if (!guild) return null;

            const member = await guild.members.fetch(userId).catch(() => null);
            if (member && member.presence) {
                presenceInfo = {
                    status: member.presence.status,
                    activities: member.presence.activities,
                    clientStatus: member.presence.clientStatus,
                    guild: {
                        id: guild.id,
                        name: guild.name,
                    },
                };
            }
            return presenceInfo;
        } catch (error) {
            console.error('Error fetching user presence info:', error);
            return null;
        }
    }
};

export const EditVoiceChannel = {
    data: {
        name: 'EditVoiceChannel',
        description: 'Edit the properties of a voice channel that the user is currently in, such as changing its region, bitrate, user limit, name, or topic',
        parameters: [
            {
                name: 'properties',
                type: 'object',
                description: {
                    "vi": `Đối tượng chứa các thuộc tính cần chỉnh sửa cho kênh thoại. Bao gồm { region, bitrate, userLimit, name, topic }. region là khu vực gồm [${Object.keys(DISCORD_VOICE_REGIONS).map(key => `'${key}'`).join(', ')}]. Nếu muốn Auto thì set giá trị null, discord tự hiểu là auto; bitrate là số nguyên đại diện cho bitrate mới (tối đa 384000); userLimit là số nguyên đại diện cho giới hạn người dùng mới (0-99, 0 là không giới hạn); name là tên mới của kênh thoại; topic là ghi chú/mô tả/trạng thái mới của kênh thoại`,
                    "en": `Object containing properties to edit for the voice channel. Includes { region, bitrate, userLimit, name, topic }. region is one of [${Object.keys(DISCORD_VOICE_REGIONS).map(key => `'${key}'`).join(', ')}]. To set to Auto, use null; bitrate is an integer representing the new bitrate (max 384000); userLimit is an integer representing the new user limit (0-99, 0 means no limit); name is the new name for the voice channel; topic is the new description/topic/status for the voice channel`
                },
                required: true,
            },
        ],
        returns: { type: 'boolean', description: 'True if the operation was successful, otherwise false' },
    },
    async execute(client, interaction, properties) {
        let parsedProperties = properties;
        if (typeof properties === 'string') {
            try {
                parsedProperties = JSON.parse(properties);
            } catch (parseError) {
                console.error('Failed to parse properties:', parseError);
                return {
                    success: false,
                    error: 'Invalid properties format'
                };
            }
        }

        const { region, bitrate, userLimit, name, topic } = parsedProperties;
        try {
            // Get current channel user joined
            const channel = interaction.member?.voice?.channel;
            if (!channel) {
                console.error('User is not in a voice channel.');
                return {
                    success: false,
                    error: 'User is not in a voice channel'
                };
            }

            const updateData = {};
            
            // Region validation
            if (region !== undefined) {
                if (region === 'automatic' || region === null) {
                    updateData.rtcRegion = null;
                } else if (Object.keys(DISCORD_VOICE_REGIONS).includes(region)) {
                    updateData.rtcRegion = region;
                } else {
                    console.error('Invalid region:', region);
                    return {
                        success: false,
                        error: `Invalid region. Valid regions: ${Object.keys(DISCORD_VOICE_REGIONS).join(', ')}`
                    };
                }
            }
            
            // Bitrate validation
            if (bitrate !== undefined && bitrate !== null) {
                const bitrateNum = parseInt(bitrate);
                if (Number.isInteger(bitrateNum) && bitrateNum > 0 && bitrateNum <= 384000) {
                    updateData.bitrate = bitrateNum;
                } else {
                    console.error('Invalid bitrate:', bitrate);
                    return {
                        success: false,
                        error: 'Bitrate must be an integer between 1 and 384000'
                    };
                }
            }
            
            // User limit validation
            if (userLimit !== undefined && userLimit !== null) {
                const userLimitNum = parseInt(userLimit);
                if (Number.isInteger(userLimitNum) && userLimitNum >= 0 && userLimitNum <= 99) {
                    updateData.userLimit = userLimitNum;
                } else {
                    console.error('Invalid userLimit:', userLimit);
                    return {
                        success: false,
                        error: 'User limit must be an integer between 0 and 99'
                    };
                }
            }

            // Name validation
            if (name !== undefined && name !== null) {
                const channelName = String(name).trim();
                if (channelName.length > 0 && channelName.length <= 100) {
                    // Discord channel name rules: lowercase, no spaces (replace with dashes), no special chars
                    const validName = channelName.trim();

                    if (validName.length > 0) {
                        updateData.name = validName;
                    } else {
                        console.error('Invalid channel name after sanitization:', name);
                        return {
                            success: false,
                            error: 'Channel name must contain valid characters (letters, numbers, dashes, underscores)'
                        };
                    }
                } else {
                    console.error('Invalid channel name length:', name);
                    return {
                        success: false,
                        error: 'Channel name must be between 1 and 100 characters'
                    };
                }
            }

            // Topic validation
            if (topic !== undefined && topic !== null) {
                const channelTopic = String(topic).trim();
                if (channelTopic.length <= 1024) {
                    updateData.topic = channelTopic || null; // Empty string becomes null
                } else {
                    console.error('Invalid topic length:', topic);
                    return {
                        success: false,
                        error: 'Channel topic must be 1024 characters or less'
                    };
                }
            }

            if (Object.keys(updateData).length === 0) {
                console.error('No valid properties to update.');
                return {
                    success: false,
                    error: 'No valid properties provided'
                };
            }

            console.log('Updating channel with:', updateData);
            
            await channel.edit(updateData, 'Edited by EditVoiceChannel function');            
            
            return {
                success: true,
                channelId: channel.id,
                channelName: channel.name,
                updatedProperties: updateData,
                message: `Đã cập nhật kênh thoại "${channel.name}" thành công!`
            };
            
        } catch (error) {
            console.error('Error changing voice channel properties:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
};

const funcs = {
    GuildInfo,
    UserInfo,
    UserPresence,
    EditVoiceChannel,
};

export default funcs