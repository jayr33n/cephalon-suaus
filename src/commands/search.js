const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {requestItem} = require("../api");
const {emptyIfUndefined} = require("../common");

function getComponentsOptions() {
    return element => {
        return {
            name: `x${element.itemCount} ${element.name}`,
            value: element.name === 'Blueprint' ? ' ' : element.description,
            inline: element.name !== 'Orokin Cell'
        }
    };
}

function getDropsOptions() {
    return element => {
        return {
            name: `**${element.location}**`,
            value: `${(getDropChance(element))}% ${element.type}`,
            inline: true
        }
    };
}

function getLevelStatsOptions() {
    return element => {
        return {
            name: `${element.stats.join(' | ')}`,
            value: ` `,
            inline: true
        }
    };
}

function getMastery(mastery) {
    return mastery ? `${mastery}M` : '';
}

function getIsAvailableIcon(item) {
    return item.tradable ? '✔️' : '❌';
}

function getDropChance(element) {
    return (element.chance * 100)
        .toFixed(2)
        .replace(/\.?0+$/, '');
}

function shortenMergedFields(fields, title) {
    const merged = fields
        .map(field => `${field['name']} ${field['value']}`)
        .map(field => field.replace('Relic', ''))
        .map(field => field.replace(title, ''))
        .filter(field => !field.includes('(Exceptional)'))
        .filter(field => !field.includes('(Flawless)'))
        .filter(field => !field.includes('(Radiant)'))
        .map(field => field.replace(' Cetus Bounty', ''))
        .map(field => field.replace('Rotation', '🔁'))
        .map(field => field.replace('Earth/Cetus', 'Cetus'))
        .map(field => field.replace('Deimos/Cambion Drift', 'Cambion Drift'))
        .map(field => field.replace('Level', 'Lvl'))
        .map(field => field.replace(' (Defense)', ''))
        .map(field => field.replace(',', ''))
        .map(field => field.replace('<DT_SENTIENT>', ''))
        .join('\n');
    if (merged.length > 1000) {
        return merged.slice(0, 1000) + ' **...**';
    }
    return merged;
}

function embedArray(title, embed, array, options, distinct) {
    if (!array || array.length === 0) {
        return;
    }
    const fields = [];
    for (const element of array) {
        if (element.name === 'Blueprint' && element.drops.length === 0)
            continue;
        const field = options(element);
        fields.push(field);
        if (distinct)
            embed.addFields(field);
        if (element.drops) {
            embedArray(title, embed, element.drops, getDropsOptions(), false);
        }
    }
    if (!distinct) {
        const merged = shortenMergedFields(fields, title);
        embed.addFields({name: ' ', value: merged, inline: false})
    }
}

function getBaseDescription(item) {
    return `**${item.type} ${emptyIfUndefined(item.trigger)} ${getMastery(item.masteryReq)}**`;
}

function getModDescription(item) {
    return `**${item.type} ${emptyIfUndefined(item.baseDrain)} - ${emptyIfUndefined(item.fusionLimit)} ${emptyIfUndefined(item.polarity).toUpperCase()} **`;
}

function embedItem(item) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(item.name)
        .setURL(item.wikiaUrl)
        .setDescription(item.category === 'Mods' ? getModDescription(item) : getBaseDescription(item))
        .setThumbnail(item.wikiaThumbnail)
    if (emptyIfUndefined(item.description) !== ' ')
        embed.addFields({name: 'Description', value: item.description})
    embed.addFields({name: `Available    ${getIsAvailableIcon(item)}`, value: ' '});
    embedArray(item.name, embed, item.levelStats, getLevelStatsOptions(), false);
    embedArray(item.name, embed, item.drops, getDropsOptions(), false);
    embedArray(item.name, embed, item.components, getComponentsOptions(), true);
    return embed;
}

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
        const item = await requestItem(argument);
        const embedded = embedItem(item);
        await interaction.editReply({embeds: [embedded]});
    },
};