// add.js within commands/utility folder
const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
      rejectUnauthorized: false,  // Necessary for Heroku
  },
});
pgClient.connect();
console.log("client connected (add)");

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
    const ingredient = interaction.options.getString('category');
    const value = interaction.options.getInteger('value');
    
    // Construct the SQL query to update the score for a given ingredient
    const updateQuery = `
      UPDATE "${tableName}"
      SET score = score + $1
      WHERE ingredient = $2;
    `;

    try {
      // Execute the query with value and ingredient as parameters
      await pgClient.query(updateQuery, [value, ingredient]);
      await interaction.reply(`Added ${value} to ${ingredient} in table ${tableName}.`);
    } catch (error) {
      console.error('Error updating category:', error);
      await interaction.reply(`Failed to update ${ingredient} in table ${tableName}.`);
    }
  },
};
