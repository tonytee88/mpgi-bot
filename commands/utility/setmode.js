const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Client } = require('pg');
const pgClient = require('./db');
const { Client: discordClient, GatewayIntentBits } = require('discord.js');
const client = new discordClient({ intents: [GatewayIntentBits.Guilds] });

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

async function setMode(userId, tableName, defaultValue) {
    const query = `
        INSERT INTO user_modes (user_id, table_name, default_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) 
        DO UPDATE SET table_name = EXCLUDED.table_name, default_value = EXCLUDED.default_value;
    `;

    await pgClient.query(query, [userId, tableName, defaultValue]);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    if (interaction.customId === 'select_table') {
        const tableName = interaction.values[0];

        // Create a string select menu for default values
        const valueSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_value')
                    .setPlaceholder('Select a default value')
                    .addOptions([
                        { label: '1', value: '1' },
                        { label: '2', value: '2' },
                        { label: '5', value: '5' },
                    ])
            );

        await interaction.update({ content: `Selected table: ${tableName}. Now, select a default value:`, components: [valueSelectMenu] });
    }
    else if (interaction.customId === 'select_value') {
        const defaultValue = interaction.values[0];

        // Here, setMode function should handle saving the user's mode preferences to the database
        // This needs to be implemented to save tableName and defaultValue associated with the user's ID
        await setMode(interaction.user.id, tableName, defaultValue);

        await interaction.update({ content: `Mode set: Adding activities to ${tableName} with default value ${defaultValue}.`, components: [] });
    }
});

// Implementation of setMode function should update the user's preferences in the database
async function setMode(userId, tableName, defaultValue) {
    // Save the mode settings to the database
    // Replace this comment with your database logic
    console.log(`Saving mode for user ${userId}: Table - ${tableName}, Default Value - ${defaultValue}`);
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('setmode')
        .setDescription('Sets the mode for adding activities.'),
    async execute(interaction) {
        // Assume fetchTableNames() is a function that returns an array of table names
        const tableNames = await fetchTableNames();

        // Create a string select menu for table names
        const tableSelectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_table')
                    .setPlaceholder('Select a table')
                    // Map each table name to an option
                    .addOptions(tableNames.map(name => ({
                        label: name,
                        description: `Set mode to add activities to ${name}`,
                        value: name,
                    })))
            );

        await interaction.reply({ content: 'Please select a table:', components: [tableSelectMenu] });
    },
};