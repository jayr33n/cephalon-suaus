require('dotenv').config();
const {REST, Routes} = require('discord.js');
const {loadCommands} = require("../src/common");

const commandsJson = []
const commands = loadCommands();
for (const command of commands) {
    commandsJson.push(command.data.toJSON());
}

const rest = new REST({version: '10'}).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands`);
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID),
            {body: commandsJson},
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands`);
    } catch (error) {
        console.error(error);
    }
})();
