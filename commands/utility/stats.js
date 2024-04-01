const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,  // Necessary for Heroku
  },
});

pgClient.connect();
console.log("client connected (stats)");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Displays current stats for a specified table.')
    .addStringOption(option =>
      option.setName('tablename')
        .setDescription('The name of the table to retrieve stats from')
        .setRequired(true)),
  async execute(interaction) {
    const tableName = interaction.options.getString('tablename');
    const selectQuery = `SELECT ingredient, score, goal FROM "${tableName}";`;

    try {
      const res = await pgClient.query(selectQuery);
      let replyMessage = `Current Stats for ${tableName}:\n`;

      // Iterate over each row to build progress bars
      res.rows.forEach(row => {
        const ingredient = row.ingredient;
        const score = row.score || 0; // Treat undefined as 0
        const goal = row.goal;
        const progressBar = '|' .repeat(score) + '-' .repeat(goal - score);
        replyMessage += `${ingredient}: ${progressBar} (${score}/${goal})\n`;
      });

      await interaction.reply(replyMessage);
    } catch (error) {
      console.error('Error retrieving stats:', error);
      await interaction.reply(`Failed to retrieve stats from ${tableName}.`);
    }
  },
};
