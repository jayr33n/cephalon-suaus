const {SlashCommandBuilder} = require('discord.js');
const {request} = require('undici');
const itemsUrl = require('../config.js').warframe.api.url.items;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('i')
        .setDescription('Queries an existing item')
        .addStringOption(option => option
            .setName("item")
            .setDescription("The item to query for")
            .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        const argument = interaction.options.getString('item')
        const item = await request(`${itemsUrl}${argument}/`);
    },
};
