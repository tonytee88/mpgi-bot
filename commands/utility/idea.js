const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');
const ingredients = {
    'Cooking': 50, 'Work': 20, 'Social': 10, 'Give Back': 5,
    'Husband Duty': 5, 'Fatherhood': 30, 'Body Health': 50,
    'Home Ownership': 20, 'Create-Ship': 10, 'Share': 10,
    'Learn': 5, 'Surprise': 5, 'What': 1, 'Who': 1, 'How': 1, 'Why': 1
};

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

pgClient.connect().then(() => console.log("client connected (idea)"))

async function ensureIdeasTableExists(pgClient) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ideas (
            id SERIAL PRIMARY KEY,
            category VARCHAR(255) NOT NULL,
            idea TEXT NOT NULL,
            timestamp DATE NOT NULL
        );
    `;
    await pgClient.query(createTableQuery);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('idea')
        .setDescription('Gathers an idea with a specific category.')
        .addStringOption(option =>
            option.setName('idea')
                .setDescription('The idea you want to submit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category of the idea')
                .setRequired(true)
                .setAutocomplete(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const idea = interaction.options.getString('idea');
        const category = interaction.options.getString('category');
        const currentDate = new Date().toISOString().split('T')[0];  // Format as YYYY-MM-DD

        await ensureIdeasTableExists(pgClient);

        const insertQuery = `INSERT INTO ideas (category, idea, timestamp) VALUES ($1, $2, $3);`;

        try {
            await pgClient.query(insertQuery, [category, idea, currentDate]);
            await interaction.editReply(`Idea added successfully: ${idea} under ${category}.`);
        } catch (error) {
            console.error('Error inserting idea into database:', error);
            await interaction.editReply('Failed to add idea.');
        }
    },
    async autocomplete(interaction) {
        if (interaction.commandName === 'idea' && interaction.options.getFocused(true).name === 'category') {
            const focusedOption = interaction.options.getFocused(true);
            const choices = Object.keys(ingredients);
            const focusedValue = focusedOption.value;
            const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: choice, value: choice }))
            );
        }
    },
};
