const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');
const pgClient = require('./db');

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

// const pgClient = new Client({
//   connectionString: process.env.POSTGRES_CONNECTION_STRING,
//   ssl: {
//       rejectUnauthorized: false,
//   },
// });
//pgClient.connect();


module.exports = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Creates a new goal tracking table.')
    .addStringOption(option =>
      option.setName('tablename')
        .setDescription('The name of the table to create')
        .setRequired(true)),
  async execute(interaction) {
    const tableName = interaction.options.getString('tablename');

    // Validate table name to be alphanumeric with underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        await interaction.reply('Invalid table name. Table names must be alphanumeric and may contain underscores.');
        return;
    }

    // Ensure the table_metadata exists
    const createMetadataTableQuery = `
      CREATE TABLE IF NOT EXISTS table_metadata (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pgClient.query(createMetadataTableQuery);

    // Create the user-defined table
    let createTableQuery = `
      CREATE TABLE "${tableName}" (
        id SERIAL PRIMARY KEY,
        ingredient VARCHAR(255) NOT NULL,
        score INT DEFAULT 0,
        goal INT NOT NULL
      );
    `;

    try {
        await pgClient.query(createTableQuery);

        // Insert a record for the new table into table_metadata
        const insertMetadataQuery = `
          INSERT INTO table_metadata (table_name)
          VALUES ($1);
        `;
        await pgClient.query(insertMetadataQuery, [tableName]);

        for (const [ingredient, goal] of Object.entries(ingredients)) {
            let insertQuery = `
              INSERT INTO "${tableName}" (ingredient, goal) 
              VALUES ($1, $2);
            `;
            await pgClient.query(insertQuery, [ingredient, goal]);
        }

        await interaction.reply(`Table "${tableName}" created and populated successfully.`);
    } catch (error) {
        console.error('Error creating and populating table:', error);
        await interaction.reply(`Failed to create and populate table "${tableName}".`);
    }
  },
};
