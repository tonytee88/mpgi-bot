const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, SelectMenuBuilder, Events } = require('discord.js');
const { Client } = require('pg');
const { Client: discordClient, GatewayIntentBits } = require('discord.js');
const client = new discordClient({ intents: [GatewayIntentBits.Guilds] });
const pgClient = require('./db');

async function fetchTableNames(pgClient) {
    const query = `
        SELECT m.table_name
        FROM table_metadata m
        JOIN information_schema.columns c ON m.table_name = c.table_name
        WHERE c.column_name = 'ingredient'
        AND m.table_name != 'activity_logs'
        AND m.created_at IS NOT NULL
        ORDER BY m.created_at DESC;
    `;

    const result = await pgClient.query(query);
    return result.rows.map(row => row.table_name);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setmode')
        .setDescription('Sets the mode for adding activities.'),
    async execute(interaction) {
        // Assume fetchTableNames() is a function that returns an array of table names
        const tableNames = await fetchTableNames(pgClient);
        console.log("table names load ok");
        // Create a string select menu for table names
        const tableSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_table')
                    .setPlaceholder('Select a table')
                    // Map each table name to an option
                    .addOptions(tableNames.map(name => ({
                        label: name,
                        description: `Set mode to add activities/ideas to ${name}`,
                        value: name,
                    })))
            );
        console.log("table menu selection OK");
        await interaction.reply({ content: 'Please select a table:', components: [tableSelectMenu] });
    },
};