console.log("hello world heroku");
const express = require('express');
const app = express();

// Respond with "Bot is running" on the root URL ("/")
app.get('/', (req, res) => {
  res.send('Bot is running');
});

// Listen on the appropriate port for Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const Discord = require('discord.js')
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Discord.Client({
    intents: [GatewayIntentBits.FLAGS.GUILDS, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, ]
});
const token = process.env.DISCORD_BOT_TOKEN;

const { Client: pgClient } = require('pg');
const pg_Client = new pgClient({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false,  // allows connection to Heroku PostgreSQL without a valid certificate
    },
  });

pg_Client.connect();
console.log("client connected")

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// clientdiscord.on('message', async (msg) => {
//     if (msg.content.toLowerCase() === 'hello') {
//         try {
//             await helloplusone(msg);
//         } catch (error) {
//             console.error('Error updating progress:', error);
//             msg.reply('Sorry, there was an error processing your request.');
//         }
//     }
// });

// async function incrementCategoryX() {
//     await client.query(`
//         UPDATE categories
//         SET total_points = total_points + 1
//         WHERE category_name = 'Category X'
//     `);
// }

// async function getTotalPointsForCategoryX() {
//     const result = await client.query(`
//         SELECT total_points
//         FROM categories
//         WHERE category_name = 'Category X'
//     `);
//     return result.rows[0].total_points;
// }

// // Modified to accept the message object
// async function helloplusone(msg) {
//     await incrementCategoryX();
//     const totalPoints = await getTotalPointsForCategoryX();
//     const progressIndicator = '|'.repeat(totalPoints);
//     console.log(`Total points for Category X: ${totalPoints}`);
//     console.log(`Progress: ${progressIndicator}`);
//     msg.reply("hello"); // Reply "hello" here
//     msg.reply(`hello: ${progressIndicator}`); // Show progress after incrementing
// }


//test simply hello
client.on('message', message => {
    // Ignore messages from the bot itself or other bots to prevent loops or unnecessary processing.
   console.log("message read in channel")
    if (message.author.bot) return;
    if (message.content.includes('hello')) {
    message.channel.send("hey nice job");
    }

});

//test pg connect + query
// clientdiscord1.on('message', async (message) => {
//     if (message.author.bot) return;

//     // Command to list all tables
//     if (message.content.toLowerCase() === '!listtables') {
//         try {
//             const res = await pgClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
//             let reply = "Tables: ";
//             res.rows.forEach(row => {
//                 reply += row.table_name + ", ";
//             });
//             message.reply(reply.slice(0, -2)); // Remove last comma and space
//         } catch (error) {
//             console.error('Error querying database for table list:', error);
//             message.reply('Error retrieving table list.');
//         }
//     }

//     // Command to get data from a specified table
//     if (message.content.toLowerCase().startsWith('!getdata')) {
//         const args = message.content.split(' ');
//         if (args.length < 2) {
//             message.reply('Please provide a table name.');
//             return;
//         }
//         const tableName = args[1]; // Get the table name from the command

//         try {
//             // Fetch the first 5 rows from the specified table
//             const query = `SELECT * FROM ${pgClient.escapeIdentifier(tableName)} LIMIT 5;`;
//             const res = await pgClient.query(query);
//             let reply = `First 5 rows from ${tableName}: \n`;

//             res.rows.forEach((row, index) => {
//                 reply += `${index + 1}: ${JSON.stringify(row)}\n`;
//             });

//             message.reply(reply);
//         } catch (error) {
//             console.error(`Error querying data from table ${tableName}:`, error);
//             message.reply(`Error retrieving data from ${tableName}.`);
//         }
//     }
// });

//end of pg.test
client.login(token);

