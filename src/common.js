const fs = require('node:fs');
const path = require('node:path');

function loadCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command);
    }
    return commands;
}

module.exports = {loadCommands}
