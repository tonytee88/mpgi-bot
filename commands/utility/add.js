const { SlashCommandBuilder } = require('discord.js');
const { Client } = require('pg');
const stringSimilarity = require('string-similarity');

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
console.log("client connected (add)");

const ingredientsList = Object.keys(ingredients).map(ingredient => ingredient.toLowerCase());

const ensureActivityLogTableExists = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(255) NOT NULL,
            ingredient VARCHAR(255) NOT NULL,
            activity_note TEXT NOT NULL,
            activity_date DATE NOT NULL
        );
    `;

    try {
        await pgClient.query(createTableQuery);
        console.log('Ensured activity_logs table exists.');
    } catch (error) {
        console.error('Error ensuring activity_logs table exists:', error);
        throw error;
    }
};

module.exports = {
    data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adds a value to a category in a specified table, with a description of the activity.')
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
        .setRequired(true))
    .addStringOption(option =>
      option.setName('activitynote')
        .setDescription('Description of the task that was accomplished')
        .setRequired(true)),
        async execute(interaction) {
            await ensureActivityLogTableExists();
            
            const tableName = interaction.options.getString('tablename');
            const userCategory = interaction.options.getString('category');
            const value = interaction.options.getInteger('value');
            const activityNote = interaction.options.getString('activitynote');
            const currentDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
        
            const normalizedInput = userCategory.toLowerCase();
            const matches = stringSimilarity.findBestMatch(normalizedInput, ingredientsList);
        
            if (matches.bestMatch.rating < 0.8) {
              await interaction.reply("Please enter a valid category.");
              return;
            }
        
            const matchedIngredient = matches.bestMatch.target;
        
            // Begin transaction for updating score and logging activity
            try {
              await pgClient.query('BEGIN');
        
              const updateScoreQuery = `
                UPDATE "${tableName}"
                SET score = score + $1
                WHERE LOWER(ingredient) = $2;
              `;
              await pgClient.query(updateScoreQuery, [value, matchedIngredient]);
        
              const logActivityQuery = `
                INSERT INTO activity_logs (table_name, ingredient, activity_note, activity_date)
                VALUES ($1, $2, $3, TO_DATE($4, 'MON-DD-YYYY'));
              `;
              await pgClient.query(logActivityQuery, [tableName, matchedIngredient, activityNote, currentDate]);
        
              await pgClient.query('COMMIT');
              
              await interaction.reply(`Added ${value} to ${matchedIngredient} with note: '${activityNote}' on ${currentDate} in table ${tableName}.`);
            } catch (error) {
              await pgClient.query('ROLLBACK');
              console.error('Error updating category or logging activity:', error);
              await interaction.reply(`Failed to update ${matchedIngredient} or log activity in table ${tableName}.`);
            }
          },
};
