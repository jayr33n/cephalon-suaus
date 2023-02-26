const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {requestItem} = require("../api");
const source = require('../config.js').source.url;

function embedComponents(embed, components) {
    for (const component of components) {
        if (component.name === 'Blueprint') continue;
        embed.addFields({
            name: `x${component.itemCount} ${component.name}`,
            value: component.description,
            inline: true
        });
    }
}

function embedItem(item) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(item.name)
        .setURL(item.wikiaUrl)
        .setDescription(`${item.type} | ${item.trigger} | ${item.masteryReq}M`)
        .setThumbnail(item.wikiaThumbnail)
        .addFields({name: 'Description', value: item.description});
    embedComponents(embed, item.components);
    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('i')
        .setDescription('Queries an existing item')
        .addStringOption(option => option
            .setName("item")
            .setDescription("The item to query for")
            .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const argument = interaction.options.getString('item');
        const item = await requestItem(argument);
        const embedded = embedItem(item);
        await interaction.editReply({embeds: [embedded]});
    },
};
