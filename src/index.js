const env = require('dotenv').config()
const {Client, Events, GatewayIntentBits, Collection} = require('discord.js');
const {loadCommands, log} = require("./common");

const client = new Client({intents: [GatewayIntentBits.Guilds]});
client.once(Events.ClientReady, client => {
    log(`Logged in as ${client.user.tag}`);
});

client.commands = new Collection();
const commands = loadCommands();
for (const command of commands) {
    client.commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    try {
        log(`Executing command (${command.data.name}) for (${interaction.user.tag}) (${interaction.user.id})...`);
        await command.execute(interaction);
        log(`Successfully executed command (${command.data.name}) for (${interaction.user.tag}) (${interaction.user.id})`);
    } catch (error) {
        log('❌ ' + error)
        const content = !error.message ?
            {content: '❌ \`Something went wrong :(\`'} :
            {content: `❌ ${error.message}`};
        if (interaction.replied || interaction.deferred)
            await interaction.followUp(content);
        else
            await interaction.reply(content);
    }
});

client.login(process.env.TOKEN);
