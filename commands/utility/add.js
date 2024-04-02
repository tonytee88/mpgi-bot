const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const stringSimilarity = require('string-similarity');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fetch = require('node-fetch');
const { Client: discordClient, Collection, Events, GatewayIntentBits } = require('discord.js');

const client = new discordClient({ intents: [GatewayIntentBits.Guilds] });

//const token = process.env.DISCORD_BOT_TOKEN;

const ingredients = {
    'Cooking': 50, 'Work': 20, 'Social': 10, 'Give Back': 5,
    'Husband Duty': 5, 'Fatherhood': 30, 'Body Health': 50,
    'Home Ownership': 20, 'Create-Ship': 10, 'Share': 10,
    'Learn': 5, 'Surprise': 5, 'What': 1, 'Who': 1, 'How': 1, 'Why': 1
};

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isAutocomplete() && interaction.commandName === 'add') {
        const focusedValue = interaction.options.getFocused(true);
        console.log("condition: autocomplete on and is add.js")
        if (focusedValue.name === 'category') {
            console.log("field is category")
            const choices = Object.keys(ingredients);
            const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue.value.toLowerCase()));
            
            const limited = filtered.slice(0, 25).map(choice => ({ name: choice, value: choice.toLowerCase().replace(/\s+/g, '_') }));
            
            await interaction.respond(limited.map(choice => ({ name: choice.name, value: choice.value })));
        }
    }
});

// Initialize the S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function uploadImageToS3(imageUrl, bucketName) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const imageBuffer = await response.buffer();
    const imageKey = `images/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;

    try {
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: imageKey,
                Body: imageBuffer,
                ContentType: 'image/png',
            },
        });

        const uploadResult = await parallelUploads3.done();
        return { key: imageKey, Bucket: bucketName };
    } catch (err) {
        throw new Error(`Failed to upload image: ${err.message}`);
    }
}

async function generatePreSignedUrl(bucketName, imageKey) {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

const pgClient = new Client({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Ensure the connection is established before any query execution
pgClient.connect().then(() => console.log("client connected (add)"))
                 .catch((e) => console.error('Failed to connect to PostgreSQL', e));

const ensureActivityLogTableExists = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(255) NOT NULL,
            ingredient VARCHAR(255) NOT NULL,
            activity_note TEXT NOT NULL,
            activity_date DATE NOT NULL,
            image_url TEXT
        );
    `;

    try {
        await pgClient.query(createTableQuery);
        console.log('Ensured activity_logs table exists.');
    } catch (error) {
        console.error('Error ensuring activity_logs table exists:', error);
    }
};



const ingredientsList = Object.keys(ingredients).map(ingredient => ingredient.toLowerCase());

module.exports = {
    data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adds a value to a category in a specified table, with a description of the activity.')
    .addStringOption(option => option.setName('tablename').setDescription('The name of the table to update').setRequired(true))
    .addStringOption(option =>
        option.setName('category')
        .setDescription('The category to increment:')
        .setRequired(true)
        .setAutocomplete(true))
    .addIntegerOption(option => option.setName('value').setDescription('The value to add').setRequired(true))
    .addStringOption(option => option.setName('activitynote').setDescription('Description of the task that was accomplished').setRequired(true))
    .addAttachmentOption(option => option.setName('image').setDescription('Optional image to upload').setRequired(false)),
    async execute(interaction) {
        await ensureActivityLogTableExists();
        
        const tableName = interaction.options.getString('tablename');
        const userCategory = interaction.options.getString('category');
        const value = interaction.options.getInteger('value');
        const activityNote = interaction.options.getString('activitynote');
        const imageAttachment = interaction.options.getAttachment('image');
        const currentDate = new Date().toISOString().split('T')[0];  // Format as YYYY-MM-DD

        const normalizedInput = userCategory.toLowerCase();
        const matches = stringSimilarity.findBestMatch(normalizedInput, ingredientsList);

        if (matches.bestMatch.rating < 0.8) {
            await interaction.reply("Please enter a valid category.");
            return;
        }

        const matchedIngredient = matches.bestMatch.target;

        let imageUrl = null;
        if (imageAttachment) {
            try {
                const { key, Bucket } = await uploadImageToS3(imageAttachment.url, process.env.AWS_S3_BUCKET_NAME);
                imageUrl = await generatePreSignedUrl(Bucket, key);
            } catch (error) {
                console.error('Error uploading image to S3:', error);
            }
        }

        try {
            await pgClient.query('BEGIN');

            const updateScoreQuery = `UPDATE "${tableName}" SET score = score + $1 WHERE LOWER(ingredient) = $2;`;
            await pgClient.query(updateScoreQuery, [value, matchedIngredient.toLowerCase()]);

            const logActivityQuery = `INSERT INTO activity_logs (table_name, ingredient, activity_note, activity_date, image_url)
                                      VALUES ($1, $2, $3, $4, $5);`;
            await pgClient.query(logActivityQuery, [tableName, matchedIngredient, activityNote, currentDate, imageUrl]);

            await pgClient.query('COMMIT');

            let responseMessage = `Added ${value} to ${matchedIngredient} with note: '${activityNote}' on ${currentDate} in table ${tableName}.`;
            if (imageUrl) {
                responseMessage += `\nImage URL (accessible for 1 hour): ${imageUrl}`;
            }

            await interaction.reply(responseMessage);
        } catch (error) {
            await pgClient.query('ROLLBACK');
            console.error('Error updating category or logging activity:', error);
            await interaction.reply(`Failed to update ${matchedIngredient} or log activity in table ${tableName}.`);
        }
    },
};
