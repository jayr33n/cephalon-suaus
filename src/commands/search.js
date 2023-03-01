const {SlashCommandBuilder} = require('discord.js');
const {requestItem} = require("../stats/stats-api");
const Embedding = require("../embedding");
const {log} = require("../common");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('s')
        .setDescription('Searches an existing item')
        .addStringOption(option => option
            .setName("search")
            .setDescription("The item to search for")
            .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const argument = interaction.options.getString('search');
        log(`Requesting stats for (${argument}) from (${interaction.user.tag})...`);
        const item = await requestItem(argument);
        log(`Stats found for (${argument}): ${JSON.stringify(item).length} characters`);
        const embed = Embedding.embedItem(item);
        await interaction.editReply({embeds: [embed]});
    },
};
