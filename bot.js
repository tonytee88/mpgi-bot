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

const { Client: clientDiscord, GatewayIntentBits } = require('discord.js');

const clientdiscord = new clientDiscord({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, ]
});
const token = process.env.DISCORD_BOT_TOKEN;

const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false,  // allows connection to Heroku PostgreSQL without a valid certificate
    },
  });

client.connect();
console.log("client connected")

clientdiscord.on('ready', () => {
    console.log(`Logged in as ${clientdiscord.user.tag}!`);
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
clientdiscord.on('message', async (msg) => {
    // Ignore messages from the bot itself or other bots to prevent loops or unnecessary processing.
    if (msg.author.bot) return;

    // Check if the message content is 'hello1' (case-insensitive).
    if (msg.content.toLowerCase() === 'hello1') {
        try {
            // Reply to the message with 'hello2'.
            await msg.reply('hello2');
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    }

    // Your existing code for handling 'hello'.
    if (msg.content.toLowerCase() === 'hello') {
        try {
            await helloplusone(msg); // Assuming this is a function you've defined elsewhere.
        } catch (error) {
            console.error('Error updating progress:', error);
            msg.reply('Sorry, there was an error processing your request.');
        }
    }
});


clientdiscord.login(token);
