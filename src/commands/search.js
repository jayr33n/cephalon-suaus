const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {requestItem} = require("../stats/stats-api");
const {emptyIfUndefined, log} = require("../common");
const {findMarketItem, findItem} = require("../market/lookup");

function getComponentsOptions() {
    return element => {
        return {
            name: `- - - - - - - - - - - - - -\nx${element.itemCount} ${element.name}`,
            value: element.name === 'Blueprint' ? ' ' : element.description,
            inline: element.name !== 'Orokin Cell'
        }
    };
}

function getDropsOptions() {
    return element => {
        if (element.location.includes("Relic")) {
            const relicItem = findItem(element.location);
            if (relicItem !== undefined)
                return {
                    name: `**${element.location}**`,
                    value: `${element.type} (${element.rarity}) ${relicItem.vaulted ? '(Vaulted)' : '(Available)'}`,
                    inline: true
                }
        }
        return {
            name: `**${element.location}**`,
            value: `${element.type} (${getDropChance(element)}%)`,
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

function getOrdersOptions() {
    return element => {
        return {
            name: `🎮 **x${element.quantity}** for **${element.platinum}p ${getModRank(element.mod_rank)}**`,
            value: `\`/w ${element.user.ingame_name}\``,
            inline: true
        }
    };
}

function getModRank(modRank) {
    if (modRank === 0)
        return '(Rank 0)';
    return modRank ? `(Rank ${modRank})` : '';
}

function getMastery(mastery) {
    return mastery ? `${mastery}M` : '';
}

function getIsAvailableIcon(vaulted) {
    return vaulted === false ? '✔️' : '❌';
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
        .map(field => field.replace('<DT_SENTIENT>', '(Sentient)'))
        .map(field => field.replace('<DT_SLASH>', '(Slash)'))
        .join('\n');
    if (merged.length > 1000) {
        return merged.slice(0, 1000) + '...';
    }
    return merged;
}

function embedArray(title, embed, array, options, distinct, mergedTitle) {
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
        embed.addFields({name: emptyIfUndefined(mergedTitle), value: merged, inline: false});
    }
}

function getBaseDescription(item) {
    return `**${item.type} ${emptyIfUndefined(item.trigger)} ${getMastery(item.masteryReq)}**`;
}

function getModDescription(item) {
    return `**${item.type} ${emptyIfUndefined(item.polarity).toUpperCase()} **`;
}

function embedItem(item) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`📖 ${item.name}`)
        .setURL(item.wikiaUrl)
        .setDescription(item.category === 'Mods' ? getModDescription(item) : getBaseDescription(item))
        .setThumbnail(item.wikiaThumbnail);
    if (emptyIfUndefined(item.description) !== ' ')
        embed.addFields({name: 'Description', value: item.description});
    embedArray(item.name, embed, item.levelStats, getLevelStatsOptions(), false);
    embedArray(item.name, embed, item.drops, getDropsOptions(), false);
    embedArray(item.name, embed, item.components, getComponentsOptions(), true);
    return embed;
}

function embedMarketItem(marketItem) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`📖 ${marketItem.name}`)
        .setURL(marketItem.marketUrl);
    if (emptyIfUndefined(marketItem.vaulted) !== ' ')
        embed.addFields({name: `Available    ${getIsAvailableIcon(marketItem.vaulted)}`, value: ' '});
    embedArray(
        marketItem.name,
        embed,
        marketItem.orders.slice(0, 10),
        getOrdersOptions(),
        false,
        `📈 Orders (Top 10)`);
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
        log(`Requesting stats for (${argument}) from (${interaction.user.tag})...`);
        const item = await requestItem(argument);
        log(`Stats found for (${argument}): ${JSON.stringify(item).length} characters`);
        const embeddedItem = embedItem(item);
        await interaction.editReply({embeds: [embeddedItem]});
        log(`Requesting orders for (${argument}) from (${interaction.user.tag})...`);
        await interaction.followUp({content: `⚙️ Searching for \`${item.name}\` orders on the warframe market...`})
        findMarketItem(item.name).then(
            marketItem => {
                log(`Orders found for (${argument}): ${JSON.stringify(marketItem).length} characters`);
                const embeddedMarketItem = embedMarketItem(marketItem);
                interaction.followUp({embeds: [embeddedMarketItem]});
            },
            error => interaction.followUp({content: `${error.message}`}));
    },
};
