const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');

const pgClient = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: isProduction ? {
      rejectUnauthorized: false, // Necessary for Heroku
    } : false,
});

pgClient.connect();

// Function to check if the "messages" table exists and create it if not
async function ensureTableExists() {
    const tableExistsQuery = `
        SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public' AND tablename  = 'messages'
        );
    `;

    const createTableQuery = `
        CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            content VARCHAR(255) NOT NULL
        );
    `;

    try {
        const res = await pgClient.query(tableExistsQuery);
        if (!res.rows[0].exists) {
            await pgClient.query(createTableQuery);
            console.log('messages table created.');
        }
    } catch (error) {
        console.error('Error checking or creating the messages table:', error);
        throw error;  // Rethrow to handle this error outside
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        try {
            // Ensure the table exists before trying to insert into it
            await ensureTableExists();

            // Insert 'hello' into the messages table
            await pgClient.query("INSERT INTO messages(content) VALUES($1)", ['hello']);

            // Reply to the interaction
            await interaction.reply('Pong!');

            console.log("Added 'hello' to the database.");
        } catch (error) {
            console.error('Error during database operation or interaction:', error);

            // Reply with an error message
            await interaction.reply('Failed to interact with the database.');
        }
    },
};