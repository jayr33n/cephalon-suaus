const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Displays additional information about the project'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xD4AF37)
            .setTitle(`📖 jayr33n/cephalon-suaus`)
            .setURL('https://github.com/jayr33n/cephalon-suaus')
            .setDescription('Cephalon Suaus is a Discord bot that provides quick item lookups for Warframe.')
            .setAuthor({name: 'jayr33n', iconURL: 'https://github.com/jayr33n.png', url: 'https://github.com/jayr33n'})
            .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png');
        await interaction.reply({embeds: [embed]});
    },
};
