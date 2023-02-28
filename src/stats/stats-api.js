const {request} = require('undici');
const itemsUrl = require('../config.js').api.stats.items;

async function requestItem(item) {
    const url = `${itemsUrl}${item}`;
    const response = await request(`${url}/`);
    if (response.statusCode !== 200)
        throw new Error(`${url} responded with ${response.statusCode}`);
    const content = await response.body.json();
    if (!content)
        throw new Error(`${url} has an empty body`);
    if (content.length === 1)
        return content[0];
    const filtered = content
        .filter(line => line.type !== 'Skin')
        .filter(line => line.type !== 'Skins')
        .filter(line => line.type !== 'Sigil')
        .filter(line => line.type !== 'Sigils')
        .filter(line => line.type !== 'Color Palette')
        .filter(line => line.type !== 'Glyph')
        .filter(line => line.type !== 'Glyphs')
        .filter(line => line.type !== 'Note Packs')
        .filter(line => {
            return line.name.toLowerCase() === item.toLowerCase()
        });
    if (filtered.length === 0) {
        if (content.length === 0)
            throw new Error(`\`${item}\` is not a valid item`);
        return content[0];
    }
    return filtered[0];
}

module.exports = {requestItem}
