//discord stuff
const Discord = require('discord.js');
const clientdiscord = new Discord.Client();
const token = process.env.DISCORD_BOT_TOKEN;

clientdiscord.on('ready', () => {
    console.log(`Logged in as ${clientdiscord.user.tag}!`);
});

clientdiscord.on('message', msg => {
    // Check if the message starts with "hello"
    if (msg.content.toLowerCase() === 'hello') {
        // Reply with "hello"
        helloplusone()
        msg.reply(`hello: ${progressIndicator}`);
    }
});


//pg stuff
const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING
});

client.connect();

// Function to increment points for Category X
async function incrementCategoryX() {
    await client.query(`
        UPDATE categories
        SET total_points = total_points + 1
        WHERE category_name = 'Category X'
    `);
}

// Function to get total points for Category X
async function getTotalPointsForCategoryX() {
    const result = await client.query(`
        SELECT total_points
        FROM categories
        WHERE category_name = 'Category X'
    `);
    return result.rows[0].total_points;
}

// Example usage
async function helloplusone() {
    await incrementCategoryX();
    const totalPoints = await getTotalPointsForCategoryX();
    const progressIndicator = '|'.repeat(totalPoints);
    console.log(`Total points for Category X: ${totalPoints}`);
    console.log(`Progress: ${progressIndicator}`);
}


clientdiscord.login(token);
