const { SlashCommandBuilder } = require('discord.js');
const { pgClient } = require('../../bot.js');

// const pgClient = new Client({
//     connectionString: process.env.POSTGRES_CONNECTION_STRING,
//     ssl: {
//         rejectUnauthorized: false,  // Necessary for Heroku
//     },
// });

// pgClient.connect();

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
            // Use pgClient to interact with the database
            await pgClient.query("INSERT INTO messages(content) VALUES($1)", ['hello']);
            await interaction.reply('Pong! Added "hello" to the database.');
        } catch (error) {
            console.error('Database interaction failed:', error);
            await interaction.reply('Failed to interact with the database.');
        }
    },

};