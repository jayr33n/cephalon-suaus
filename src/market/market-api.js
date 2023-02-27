const {request} = require('undici');
const itemsMarketUrl = require('../config.js').api.market.items;

async function requestMarketItem(urlName) {
    const url = `${itemsMarketUrl}${urlName}`;
    const response = await request(url);
    if (response.statusCode !== 200)
        throw new Error(`${url} responded with ${response.statusCode}`);
    const content = await response.body.json();
    const item = content?.payload?.item;
    if (!item)
        throw new Error(`No market item found for ${url}`);
    item.orders = await requestOrders(url);
    item.marketUrl = `https://warframe.market/items/${urlName}`
    return item;
}

async function requestOrders(url) {
    const response = await request(`${url}/orders`);
    if (response.statusCode !== 200)
        throw new Error(`${itemsMarketUrl}${urlName} responded with ${response.statusCode}`);
    const content = await response.body.json();
    const orders = content?.payload?.orders;
    if (!orders)
        throw new Error(`No orders found for ${url}`);
    return orders
        .filter(order => order.user.status === 'ingame')
        .filter(order => order.order_type === 'sell')
        .map(order => {
            order.ppq = order.platinum / order.quantity;
            return order;
        })
        .sort((a, b) => a.platinum - b.platinum);
}

module.exports = {requestMarketItem}
