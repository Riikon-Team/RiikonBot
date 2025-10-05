import { EmbedBuilder } from 'discord.js';

export class iEmbedBuilder extends EmbedBuilder {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.setFooter({ text: `/${ctx.commandName} | RiikonBot`, iconURL: ctx.client.user.displayAvatarURL() });
    }
}