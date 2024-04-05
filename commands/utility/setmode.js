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