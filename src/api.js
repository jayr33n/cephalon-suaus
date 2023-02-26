const {request} = require('undici');
const itemsUrl = require('./config.js').warframe.api.url.items;

async function internalRequest(url) {
    const response = await request(`${url}/`);
    if (response.statusCode !== 200)
        throw new Error(`${url} responded with ${response.statusCode}`);
    const content = (await response.body.json())[0];
    if (!content)
        throw new Error(`${url} has an empty body`)
    return content;
}

async function requestItem(item) {
    return await internalRequest(`${itemsUrl}${item}`);
}

module.exports = {requestItem}
