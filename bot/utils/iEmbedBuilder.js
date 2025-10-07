import { EmbedBuilder } from 'discord.js';

export class iEmbedBuilder extends EmbedBuilder {
    constructor(ctx = null) {
        super();
        this.ctx = ctx;
        this.setFooter({ text: `${ctx?.commandName ? `/${ctx.commandName}` : "Event"} | RiikonBot`, iconURL: ctx.client.user.displayAvatarURL() });
    }
}