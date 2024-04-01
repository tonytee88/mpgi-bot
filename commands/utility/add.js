// add.js within commands/utility folder
const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');

const pgClient = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
        rejectUnauthorized: false,  // Necessary for Heroku
    },
    });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adds a value to a category in a specified table.')
    .addStringOption(option =>
      option.setName('tablename')
        .setDescription('The name of the table to update')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The category to increment')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('value')
        .setDescription('The value to add')
        .setRequired(true)),
  async execute(interaction) {
    const tableName = interaction.options.getString('tablename');
    const category = interaction.options.getString('category').replace(/\s+/g, '_').toLowerCase();
    const value = interaction.options.getInteger('value');
    const updateQuery = `UPDATE ${tableName} SET ${category} = ${category} + $1;`;

    try {
      await pgClient.query(updateQuery, [value]);
      await interaction.reply(`Added ${value} to ${category} in table ${tableName}.`);
    } catch (error) {
      console.error('Error updating category:', error);
      await interaction.reply(`Failed to update ${category} in table ${tableName}.`);
    }
  },
};