const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client } = require('pg');
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
        .setName('generate_wall')
        .setDescription('Generates HTML content for the activity wall.')
        .addStringOption(option =>
            option.setName('tablename')
                .setDescription('The name of the table to generate content for')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
    
        if (focusedOption.name === 'tablename') {
            //console.log("table is focused");
            const tableNames = await fetchTableNames(pgClient);
            await interaction.respond(
                tableNames.map(tableName => ({ name: tableName, value: tableName }))
            );
        }
    },
    async execute(interaction) {
        await interaction.deferReply();
        const tableName = interaction.options.getString('tablename');

        // Fetch the relevant data
        const query = `SELECT ingredient, activity_note, activity_date, image_url FROM activity_logs WHERE table_name = $1;`;
        const result = await pgClient.query(query, [tableName]);

        // Separate entries with and without images
        let entriesWithImages = [];
        let entriesWithoutImages = [];
        result.rows.forEach(entry => {
            if (entry.image_url) {
                entriesWithImages.push(entry);
            } else {
                entriesWithoutImages.push(entry);
            }
        });

        // Generate HTML snippets (this is quite basic and should be enhanced for actual use)
        let htmlContent = '<div class="with-images">\n';
        entriesWithImages.forEach(entry => {
            htmlContent += `<div><img src="${entry.image_url}" alt="Activity Image"><p>${entry.activity_note} (${entry.activity_date})</p></div>\n`;
        });
        htmlContent += '</div>\n<div class="without-images">\n';
        entriesWithoutImages.forEach(entry => {
            htmlContent += `<div><p>${entry.activity_note} (${entry.activity_date})</p></div>\n`;
        });
        htmlContent += '</div>';

        // Provide the content for manual insertion
        await interaction.editReply(`Here's the HTML content for your MPG wall:\n\`\`\`html\n${htmlContent}\`\`\``);
    },
};