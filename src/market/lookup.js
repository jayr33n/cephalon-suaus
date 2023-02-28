const {requestMarketItem} = require("./market-api");
const lookups = require('../../vendor/warframe_market_lookups.json').payload.items;

function lookupItem(itemName) {
    const exactMatch = lookups
        .filter(item => item.item_name.toLowerCase() === itemName.toLowerCase());
    if (exactMatch.length === 0) {
        const partialMatches = lookups
            .filter(item => item.item_name.toLowerCase().includes(itemName.toLowerCase()));
        const matchingSet = partialMatches.filter(match => match.item_name.includes('Set'));
        if (matchingSet.length > 0)
            return matchingSet[0];
        return partialMatches[0];
    }
    return exactMatch[0];
}

async function findMarketItem(itemName) {
    const lookup = lookupItem(itemName);
    if (!lookup)
        throw new Error(`Could not find \`${itemName}\` on the warframe market`);
    const item = await requestMarketItem(lookup.url_name);
    item.vaulted = lookup.vaulted;
    item.name = lookup.item_name;
    return item;
}

function findItem(relicName) {
    return lookupItem(relicName);
}

module.exports = {findMarketItem, findItem};
