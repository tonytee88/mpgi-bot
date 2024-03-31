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



const { Client: pgClient } = require('pg');
const pg_Client = new pgClient({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false,  // allows connection to Heroku PostgreSQL without a valid certificate
    },
  });

pg_Client.connect();
console.log("client connected")

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

module.exports.ingredients = ingredients;
module.exports.pgClient = pg_Client;

client.login(token);