const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');
//const { ingredients } = require('../../bot.js');

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

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
      rejectUnauthorized: false,  // Necessary for Heroku
  },
});

pgClient.connect();
console.log("client connected (create)")

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

      let createTableQuery = `CREATE TABLE "${tableName}" (id SERIAL PRIMARY KEY, `;
      Object.keys(ingredients).forEach((key, index, array) => {
          let columnName = key.replace(/\s+/g, '_').toLowerCase();
          createTableQuery += `"${columnName}" INT DEFAULT 0`;
          if (index < array.length - 1) createTableQuery += ', ';
      });
      createTableQuery += ');';

      try {
          await pgClient.query(createTableQuery);
          await interaction.reply(`Table "${tableName}" created successfully.`);
      } catch (error) {
          console.error('Error creating table:', error);
          await interaction.reply(`Failed to create table "${tableName}".`);
      }
  },
};