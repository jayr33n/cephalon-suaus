require('dotenv').config();
const {REST, Routes} = require('discord.js');
const {loadCommands, log} = require("../src/common");

const commandsJson = []
const commands = loadCommands();
for (const command of commands) {
    commandsJson.push(command.data.toJSON());
}

const rest = new REST({version: '10'}).setToken(process.env.TOKEN);
(async () => {
    try {
        log(`Started refreshing ${commands.length} application (/) commands`);
        const data = await rest.put(
            process.env.global ?
                Routes.applicationCommands(process.env.CLIENT_ID) :
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID),
            {body: commandsJson},
        );
        log(`Successfully reloaded ${data.length} application (/) commands to ${process.env.global ? "global" : process.env.DEV_GUILD_ID}`);
    } catch (error) {
        console.error(error);
    }
})();
