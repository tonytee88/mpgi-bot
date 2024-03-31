const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');

const pgClient = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
        rejectUnauthorized: false,  // Necessary for Heroku
    },
});

pgClient.connect();
pgClient.connect();
console.log("client connected (server)")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Provides information about the server.'),
    async execute(interaction) {
        try {
            // Query the first row from the messages table
            const result = await pgClient.query('SELECT content FROM messages ORDER BY id ASC LIMIT 1;');

            let replyMessage = `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`;

            // If there's a row available, append its content to the reply message
            if (result.rows.length > 0) {
                const firstRowContent = result.rows[0].content;
                replyMessage += ` The first row in the messages table says: "${firstRowContent}".`;
            } else {
                replyMessage += " The messages table is currently empty.";
            }

            await interaction.reply(replyMessage);
        } catch (error) {
            console.error('Error querying the database:', error);
            await interaction.reply('Failed to retrieve information from the database.');
        }
    },
};