const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Displays additional information about the project'),
    async execute(interaction) {
        await interaction.reply({content: 'Made with ❤️ by ZigoZaro', ephemeral: true});
    },
};
