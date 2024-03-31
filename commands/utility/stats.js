const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');

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
console.log("client connected (stats)")

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
     const selectQuery = `SELECT * FROM ${tableName};`;
    console.log("test2")

    try {
      console.log("test")
      const res = await pgClient.query(selectQuery);
      let replyMessage = `Current Stats for ${tableName}:\n`;
      
      if (res.rows.length > 0) {
        const data = res.rows[0]; // Assuming one row for simplicity
        Object.keys(ingredients).forEach(key => {
          const progress = data[key.replace(/\s+/g, '_').toLowerCase()];
          const goal = ingredients[key];
          const progressBar = '|' .repeat(progress) + '-' .repeat(goal - progress);
          replyMessage += `${key}: ${progressBar} (${progress}/${goal})\n`;
        });
      }

      await interaction.reply(replyMessage);
    } catch (error) {
      console.error('Error retrieving stats:', error);
      await interaction.reply(`Failed to retrieve stats from ${tableName}.`);
    }
  },
};