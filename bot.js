console.log("hello world heroku");
const express = require('express');
const app = express();

// Respond with "Bot is running" on the root URL ("/")
app.get('/', (req, res) => {
  res.send('Bot is running');
});

// Listen on the appropriate port for Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const pgClient = require('./commands/utility/db');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const token = process.env.DISCORD_BOT_TOKEN;

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

//    intents: [GatewayIntentBits.FLAGS.GUILDS, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, ]

//array Ingredients
const ingredients = {
    'Cooking': 50,
    'Work': 20,
    'Social': 10,
    'Give Back': 5,
    'Husband Duty': 5,
    'Fatherhood': 30,
    'Body Health': 50,
    'Home Ownership': 20,
    'Create-Ship': 10,
    'Share': 10,
    'Learn': 5,
    'Surprise': 5,
    'What': 1,
    'Who': 1,
    'How': 1,
    'Why': 1
  };

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    console.log(interaction);
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		// command handling
	} else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});


client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const lastMessageAttachments = new Map();

client.on('messageCreate', async (message) => {
    // Ignore messages without attachments or from bots.
    if (message.author.bot || message.attachments.size === 0) return;
  
    // Store the latest message with attachment per channel.
    lastMessageAttachments.set(message.channelId, message.attachments.first().url);
    console.log(lastMessageAttachments)
  });

  client.on("messageCreate", function(message){
    console.log(`a message was created`);
    console.log({message});
});

async function setMode(userId, tableName, defaultValue) {
    const query = `
        INSERT INTO user_modes (user_id, table_name, default_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) 
        DO UPDATE SET table_name = EXCLUDED.table_name, default_value = EXCLUDED.default_value;
    `;

    await pgClient.query(query, [userId, tableName, defaultValue]);
    console.log(`Saving mode for user ${userId}: Table - ${tableName}, Default Value - ${defaultValue}`);

}

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isStringSelectMenu()) return;

        // Acknowledge the interaction immediately and defer the actual response
        await interaction.deferUpdate();

        if (interaction.customId === 'select_table') {
            const tableName = interaction.values[0];

            const valueSelectMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_value')
                        .setPlaceholder('Select a default value')
                        .addOptions([
                            { label: '1', value: '1' },
                            { label: '2', value: '2' },
                            { label: '5', value: '5' },
                        ]),
                );

            // The update is deferred, so now we can edit the original message
            await interaction.editReply({ content: `Selected table: ${tableName}. Now, select a default value:`, components: [valueSelectMenu] });
        } else if (interaction.customId === 'select_value') {
            const defaultValue = interaction.values[0];

            // Assume setMode is an async function that handles the mode setting
            await setMode(interaction.user.id, tableName, defaultValue);

            // Since we've already deferred, we edit the reply instead of updating directly
            await interaction.editReply({ content: `Mode set: Adding activities to ${tableName} with default value ${defaultValue}.`, components: [] });
        }
    } catch (error) {
        console.error('Error processing the interaction:', error);
        // Use editReply as interaction is already deferred
        await interaction.editReply({ content: 'There was an error processing your request.' }).catch(console.error);
    }
});

client.login(token);

module.exports.ingredients = ingredients;