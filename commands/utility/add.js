// add.js within commands/utility folder
const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');
const stringSimilarity = require('string-similarity');

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,  // Necessary for Heroku
  },
});

pgClient.connect();
console.log("client connected (add)");

const ingredientsList = Object.keys(ingredients).map(ingredient => ingredient.toLowerCase());

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
    const userCategory = interaction.options.getString('category');
    const value = interaction.options.getInteger('value');

    const normalizedInput = userCategory.toLowerCase();
    const matches = stringSimilarity.findBestMatch(normalizedInput, ingredientsList);

    // Respond with an error message if no similar ingredient is found
    if (matches.bestMatch.rating < 0.8) {  // Adjust this threshold as needed
      await interaction.reply("Please enter a valid category.");
      return;
    }

    const matchedIngredient = matches.bestMatch.target;

    const updateQuery = `
      UPDATE "${tableName}"
      SET score = score + $1
      WHERE LOWER(ingredient) = $2;
    `;

    try {
      await pgClient.query(updateQuery, [value, matchedIngredient]);
      await interaction.reply(`Added ${value} to ${matchedIngredient} in table ${tableName}.`);
    } catch (error) {
      console.error('Error updating category:', error);
      await interaction.reply(`Failed to update ${matchedIngredient} in table ${tableName}.`);
    }
  },
};
