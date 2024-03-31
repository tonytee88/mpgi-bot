// const { SlashCommandBuilder } = require('discord.js');
// const { Client } = require('pg');
// const { ingredients } = require('../../bot.js');
// const { pgClient } = require('../../bot.js');

// module.exports = {
//     data: new SlashCommandBuilder()
//       .setName('create')
//       .setDescription('Creates a new goal tracking table.')
//       .addStringOption(option =>
//         option.setName('tablename')
//           .setDescription('The name of the table to create')
//           .setRequired(true)),
//     async execute(interaction) {
//       const tableName = interaction.options.getString('tablename');
      
//       let createTableQuery = `CREATE TABLE ${tableName} (id SERIAL PRIMARY KEY, `;
//       Object.keys(ingredients).forEach((key, index, array) => {
//         createTableQuery += `${key.replace(/\s+/g, '_').toLowerCase()} INT DEFAULT 0`;
//         if (index < array.length - 1) createTableQuery += ', ';
//       });
//       createTableQuery += ');';
  
//       try {
//         await pgClient.query(createTableQuery);
//         await interaction.reply(`Table ${tableName} created successfully.`);
//       } catch (error) {
//         console.error('Error creating table:', error);
//         await interaction.reply(`Failed to create table ${tableName}.`);
//       }
//     },
//   };