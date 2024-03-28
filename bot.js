const { Client: clientDiscord, Intents } = require('discord.js');

const clientdiscord = new clientDiscord({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
const token = process.env.DISCORD_BOT_TOKEN;

const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING
});

client.connect();

clientdiscord.on('ready', () => {
    console.log(`Logged in as ${clientdiscord.user.tag}!`);
});

clientdiscord.on('message', async (msg) => { // Notice async here
    if (msg.content.toLowerCase() === 'hello') {
        try {
            await helloplusone(msg); // Await the completion of helloplusone
        } catch (error) {
            console.error('Error updating progress:', error);
            msg.reply('Sorry, there was an error processing your request.');
        }
    }
});

console.log("hello")

async function incrementCategoryX() {
    await client.query(`
        UPDATE categories
        SET total_points = total_points + 1
        WHERE category_name = 'Category X'
    `);
}

async function getTotalPointsForCategoryX() {
    const result = await client.query(`
        SELECT total_points
        FROM categories
        WHERE category_name = 'Category X'
    `);
    return result.rows[0].total_points;
}

// Modified to accept the message object
async function helloplusone(msg) {
    await incrementCategoryX();
    const totalPoints = await getTotalPointsForCategoryX();
    const progressIndicator = '|'.repeat(totalPoints);
    console.log(`Total points for Category X: ${totalPoints}`);
    console.log(`Progress: ${progressIndicator}`);
    msg.reply("hello"); // Reply "hello" here
    msg.reply(`hello: ${progressIndicator}`); // Show progress after incrementing
}

clientdiscord.login(token);