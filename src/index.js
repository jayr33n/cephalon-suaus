const env = require('dotenv').config()
const {Client, Events, GatewayIntentBits, Collection} = require('discord.js');
const {loadCommands} = require("./common");

const client = new Client({intents: [GatewayIntentBits.Guilds]});
client.once(Events.ClientReady, client => {
    console.log(`Logged in as ${client.user.tag}`);
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
        await command.execute(interaction);
    } catch (error) {
        console.log(error)
        await interaction.reply({
            content: '\`\`\`diff\n-:(\n\`\`\`',
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);
