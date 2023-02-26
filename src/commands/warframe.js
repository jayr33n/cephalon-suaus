const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('w')
        .setDescription('Queries an existing warframe')
        .addStringOption(option => option
            .setName("warframe")
            .setDescription("The warframe to query for")
            .setRequired(true)),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
