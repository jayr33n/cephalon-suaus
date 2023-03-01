const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {requestItem} = require("../stats/stats-api");
const {emptyIfUndefined, log} = require("../common");
const {findMarketItem, lookupItem} = require("../market/lookup");

function sortByRarity(drops) {
    return drops.sort((a, b) => b.chance - a.chance);
}

function mergeFields(fields, title) {
    const shortened = fields
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
        .map(field => field.replace(':', ': '))
        .map(field => field.replace('+', ' +'));
    if (shortened.length > 20) {
        shortened[19] = '...';
        return shortened
            .slice(0, 20)
            .join('\n\n');
    }
    return shortened
        .join('\n');
}

function getSpacer() {
    return '- - - - - - - - - - - - - -\n';
}

function getModRank(modRank) {
    if (modRank === 0)
        return '(Rank 0)';
    return modRank ? `(Rank ${modRank})` : '';
}

function getMastery(mastery) {
    return mastery ? `${mastery}M` : '';
}

function getDropChance(chance) {
    return (chance * 100)
        .toFixed(2)
        .replace(/\.?0+$/, '');
}

function getBaseDescription(item) {
    return `**${item.type} ${emptyIfUndefined(item.trigger)} ${getMastery(item.masteryReq)}**`;
}

function getModDescription(item) {
    return `**${item.type} ${emptyIfUndefined(item.polarity).toUpperCase()} **`;
}

function getUserStatusIcon(user) {
    if (user.status === 'ingame')
        return '🔹';
    return '🔸';
}

class Options {
    static getComponentsOptions() {
        return element => {
            return {
                name: `${getSpacer()}x${element.itemCount} ${element.name}`,
                value: element.name === 'Blueprint' ? ' ' : element.description,
                inline: element.name !== 'Orokin Cell'
            }
        };
    }

    static getDropsOptions() {
        return element => {
            if (element.location.includes("Relic")) {
                const relicItem = lookupItem(element.location);
                if (relicItem !== undefined)
                    return {
                        name: `${relicItem.vaulted ? '🔸' : '🔹'} **${element.location}**`,
                        value: `${element.type} (${element.rarity})`,
                        inline: true
                    }
            }
            return {
                name: `**${element.location}**`,
                value: `${element.type} (${getDropChance(element.chance)}%)`,
                inline: true
            }
        };
    }

    static getLevelStatsOptions() {
        return element => {
            return {
                name: `${getSpacer()}**Rank ${element.order}**\n`,
                value: `${element.stats.join('\n🆕 ')}`,
                inline: true
            }
        };
    }

    static getOrdersOptions() {
        return element => {
            return {
                name: `${getUserStatusIcon(element.user)} **x${element.quantity}** for **${element.platinum}p ${getModRank(element.mod_rank)}**`,
                value: `\`/w ${element.user.ingame_name}\``,
                inline: false
            }
        };
    }
}

class Embedding {
    static embedItem(item) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`📖 ${item.name}`)
            .setURL(item.wikiaUrl)
            .setDescription(item.category === 'Mods' ? getModDescription(item) : getBaseDescription(item))
            .setThumbnail(item.wikiaThumbnail);
        if (emptyIfUndefined(item.description) !== ' ')
            embed.addFields({name: 'Description', value: item.description});
        Embedding.embedArray(item.name, embed, item.levelStats, Options.getLevelStatsOptions(), false);
        if (item.drops && item.drops.length > 0) {
            embed.addFields({name: `${getSpacer()}🔍 Drops from:`, value: '\n'});
            Embedding.embedArray(item.name, embed, sortByRarity(item.drops), Options.getDropsOptions(), false);
        }
        Embedding.embedArray(item.name, embed, item.components, Options.getComponentsOptions(), true);
        return embed;
    }

    static embedMarketItem(marketItem) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`📖 ${marketItem.name}`)
            .setURL(marketItem.marketUrl)
            .setThumbnail(marketItem.imgUrl)
            .addFields({name: '📈 Sell Orders (Top 10)', value: ' '});
        Embedding.embedArray(
            marketItem.name,
            embed,
            marketItem.orders.slice(0, 10),
            Options.getOrdersOptions(),
            true);
        const ingame = marketItem.orders.filter(order => order.user.status === 'ingame').length;
        const online = marketItem.orders.filter(order => order.user.status === 'online').length;
        const offline = marketItem.orders.filter(order => order.user.status === 'offline').length;
        embed.addFields({name: `In game`, value: `${ingame} 🔹`, inline: true});
        embed.addFields({name: `Online`, value: `${online} 🔸`, inline: true});
        embed.addFields({name: `Offline`, value: `${offline} 🔸`, inline: true});
        return embed;
    }

    static embedArray(title, embed, array, options, distinct, mergedTitle) {
        if (!array || array.length === 0) {
            return;
        }
        const fields = [];
        let order = 1;
        for (const element of array) {
            element.order = order++;
            if (element.name === 'Blueprint' && element.drops.length === 0)
                continue;
            const field = options(element);
            fields.push(field);
            if (distinct)
                embed.addFields(field);
            if (element.drops && element.drops.length > 0) {
                embed.addFields({name: `🔍 Drops from:`, value: '\n'});
                Embedding.embedArray(title, embed, sortByRarity(element.drops), Options.getDropsOptions(), false);
            }
        }
        if (!distinct) {
            const merged = mergeFields(fields, title);
            embed.addFields({name: emptyIfUndefined(mergedTitle), value: merged, inline: false});
        }
    }
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
        const embeddedItem = Embedding.embedItem(item);
        await interaction.editReply({embeds: [embeddedItem]});
        log(`Requesting orders for (${argument}) from (${interaction.user.tag})...`);
        await interaction.followUp({content: `⚙️ Searching for \`${item.name}\` orders on the warframe market...`})
        findMarketItem(item.name).then(
            marketItem => {
                log(`Orders found for (${argument}): ${JSON.stringify(marketItem).length} characters`);
                const embeddedMarketItem = Embedding.embedMarketItem(marketItem);
                interaction.followUp({embeds: [embeddedMarketItem]});
            },
            error => interaction.followUp({content: `${error.message}`}));
    },
};
