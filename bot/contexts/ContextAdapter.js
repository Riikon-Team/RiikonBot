export class ContextAdapter {
    constructor(source, commandName = null) {
        this.isInteraction = source.isCommand?.() || source.isButton?.() || source.isStringSelect?.();
        this.isMessage = !this.isInteraction;
        this.source = source;
        this.client = source.client;
        this.commandName = source?.commandName || commandName;
        this.options = this.isInteraction ? source.options : null;
    }

    get guild() {
        return this.source.guild;
    }

    get guildId() {
        return this.source.guildId;
    }

    get channel() {
        return this.source.channel;
    }

    get channelId() {
        return this.source.channelId;
    }

    get user() {
        return this.isInteraction ? this.source.user : this.source.author;
    }

    get userId() {
        return this.user.id;
    }

    get member() {
        return this.source.member;
    }

    get voiceChannel() {
        return this.member?.voice?.channel;
    }

    get voiceChannelId() {
        return this.member?.voice?.channelId;
    }

    // Alias for compatibility
    get author() {
        return this.user;
    }

    /**
     * Get option/argument value - FIXED
     */
    getOption(name, type = 'string') {
        if (this.isInteraction) {
            // For slash commands, get from options
            switch (type) {
                case 'string': return this.source.options.getString(name);
                case 'integer': return this.source.options.getInteger(name);
                case 'boolean': return this.source.options.getBoolean(name);
                case 'user': return this.source.options.getUser(name);
                case 'channel': return this.source.options.getChannel(name);
                default: return this.source.options.get(name)?.value;
            }
        }
        // For prefix commands, parse from message content
        return this._parseMessageArg(name);
    }

    /**
     * Reply to user
     */
    async reply(content) {
        if (this.isInteraction) {
            if (this.source.deferred || this.source.replied) {
                return await this.source.editReply(content);
            }
            return await this.source.reply(content);
        }
        return await this.source.reply(content);
    }

    /**
     * Defer reply
     */
    async defer(ephemeral = false) {
        if (this.isInteraction && !this.source.deferred && !this.source.replied) {
            return await this.source.deferReply({ ephemeral });
        }
        return await this.source.reply({ content: '...', ephemeral });
    }

    /**
     * Edit reply
     */
    async editReply(content) {
        if (this.isInteraction) {
            return await this.source.editReply(content);
        }
        try {
            const messages = await this.source.channel.messages.fetch({ limit: 5 });
            const botReply = messages.find(msg =>
                msg.author.id === this.source.client.user.id &&
                msg.reference?.messageId === this.source.id
            );

            if (botReply) {
                return await botReply.edit(content);
                // send to this channel, no reply
                // return await this.source.channel.send(content);
            }
            // If no reply found, send new message
            return await this.source.channel.send(content);
        } catch (error) {
            console.error('Failed to edit message reply:', error);
            return await this.source.channel.send(content);
        }
    }

    /**
     * Parse message arguments for prefix commands - FIXED
     */
    _parseMessageArg(name) {
        // Only for message commands, not interactions
        if (this.isInteraction) {
            console.warn("_parseMessageArg called for interaction - this should not happen");
            return null;
        }

        // Make sure content exists
        const content = this.source.content;
        if (!content || typeof content !== 'string') {
            console.warn("Message content is not a string:", content);
            return null;
        }

        const args = content.split(' ').slice(1);

        // Handle different argument types
        switch (name) {
            case 'query':
            case 'input':
                return args.join(' ') || null;
            case 'count':
            case 'position':
            case 'page':
            case 'level':
            case 'volume': {
                const num = Number.parseInt(args[0]);
                return Number.isNaN(num) ? null : num;
            }
            case 'user': {
                // Parse user mention
                const userMatch = args[0]?.match(/<@!?(\d+)>/);
                if (userMatch) {
                    return this.client.users.cache.get(userMatch[1]);
                }
                return null;
            }
            case 'add_first':
                // Check if "add_first" or similar flag exists in args
                return args.includes('add_first') || args.includes('-f') || args.includes('--first');
            default:
                return args[0] || null;
        }
    }
}