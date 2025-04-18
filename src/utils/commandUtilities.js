import { SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from "discord.js"

export const displayCurrentTime = () => {
    const date = new Date()
    return [date.getDate(), date.getMonth(), date.getFullYear()].join("/") + " " +
        [date.getHours(), date.getMinutes()].join(":")
}

//Command Options Class
class CommandOptions {
    /**
     * 
     * @param {String} name 
     * @param {String} description 
     * @param {number} min 
     * @param {number} max 
     * @param {boolean} required 
     * @param {String} type - Type of command. 
     * Choose one between `string`, `integer`, `boolean`, `user`, `channel`, `role`, `mentionable`, `number`, `attachment` 
     * @param {boolean} autocomplete 
     * @param {[]} choices 
     */
    constructor(name = "",
        description = "",
        min = null,
        max = null,
        required = false,
        type = "",
        autocomplete = false,
        choices = [],
        // channelType = ""
    ) {
        // description_localizations
        // name_localizations 
        // this.channelType = channelType
        this.name = name
        this.description = description
        this.min = min
        this.max = max
        this.required = required
        this.type = type
        this.autocomplete = autocomplete
        this.choices = choices
    }
}

//Load command options
/**
 * Add an option for command
 * @param {SlashCommandBuilder} command - Command that option is added to
 * @param {CommandOptions} commandsOption - Command option's detail
 * @returns {SlashCommandBuilder}
 */
export const addCommandOption = (command, commandsOption) => {
    //FIXME: Need check type and commandsOption must have attribute
    if (!commandsOption.name) {
        throw new ReferenceError("CommandOptions must have name attribute!")
    }

    const typeCommand = new Map([
        {type: 'string', option: new SlashCommandStringOption()},
        {type: 'integer', option: new SlashCommandIntegerOption()},
        {type: 'number', option: new SlashCommandNumberOption()},
        {type: 'boolean', option: new SlashCommandBooleanOption()},
        {type: 'user', option: new SlashCommandUserOption()},
        {type: 'channel', option: new SlashCommandChannelOption()},
        {type: 'role', option: new SlashCommandRoleOption()},
        {type: 'mentionable', option: new SlashCommandMentionableOption()},
        {type: 'attachment', option: new SlashCommandAttachmentOption()},
    ].map(obj => [obj.type, obj.option]))
    
    const option = typeCommand.get(commandsOption)
    option.setName(commandsOption.name)
    option.setDescription(commandsOption.description)
    option.setRequired(commandsOption.required)
    if (type === "number" || type === "integer") {
        option.setMinValue(commandsOption.min)
        option.setMaxValue(commandsOption.max)
    }
    if (type === "string") {
        option.setMinLength(commandsOption.min)
        option.setMaxLength(commandsOption.max)
    }
    if (["number", "integer", "string"].indexOf(type) !== -1) {
        option.setAutocomplete(commandsOption.autocomplete)
        option.setChoices(commandsOption.choices)
    }
    if (type === "channel") option.addChannelTypes(commandsOption.channelType)

    switch (optionType) {
        case 'string':
            command.addStringOption(() => option)
            break

        case 'integer':
            command.addIntegerOption(() => option)
            break

        case 'boolean':
            command.addBooleanOption(() => option)
            break

        case 'user':
            command.addUserOption(() => option)
            break

        case 'channel':
            command.addChannelOption(() => option)
            break

        case 'role':
            command.addRoleOption(() => option)
            break

        case 'mentionable':
            command.addMentionableOption(() => option)
            break

        case 'number':
            command.addNumberOption(() => option)
            break

        case 'attachment':
            command.addAttachmentOption(() => option)
            break
        default: break
    }
    return command

}