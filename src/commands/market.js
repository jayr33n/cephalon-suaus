const {SlashCommandBuilder} = require('discord.js');
const {log} = require("../common");
const {findMarketItem} = require("../market/lookup");
const Embedding = require("../embedding");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('m')
        .setDescription('Searches an existing item on the warframe market')
        .addStringOption(option => option
            .setName("market")
            .setDescription("The item to search for")
            .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const argument = interaction.options.getString('market');
        log(`Requesting orders for (${argument}) from (${interaction.user.tag})...`);
        const item = await findMarketItem(argument);
        log(`Orders found for (${argument}): ${JSON.stringify(item).length} characters`);
        const embed = Embedding.embedMarketItem(item);
        await interaction.editReply({embeds: [embed]});
    },
};
