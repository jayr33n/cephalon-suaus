const {request} = require('undici');
const itemsUrl = require('./config.js').warframe.api.url.items;

async function internalRequest(url, filter) {
    const response = await request(`${url}/`);
    if (response.statusCode !== 200)
        throw new Error(`${url} responded with ${response.statusCode}`);
    const content = await response.body.json();
    if (!content)
        throw new Error(`${url} has an empty body`);
    if (content.length === 1)
        return content[0];
    const filtered = content.filter(filter);
    if (filtered.length === 0) {
        if (content.length === 0)
            throw new Error('No valid item was found.');
        return content[0];
    }
    return filtered[0];
}

async function requestItem(item) {
    return await internalRequest(
        `${itemsUrl}${item}`,
        line => {
            return line.name.toLowerCase() === item.toLowerCase()
        });
}

module.exports = {requestItem}
