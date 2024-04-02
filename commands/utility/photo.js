const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fetch = require('node-fetch');

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

    // Using lib-storage to manage multipart upload
    try {
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: imageKey,
                Body: imageBuffer,
                ContentType: 'image/png',
            },
            leavePartsOnError: false, // optional manually handle dropped parts
        });

        const uploadResult = await parallelUploads3.done();
        return uploadResult;
    } catch (err) {
        throw new Error(`Failed to upload image: ${err.message}`);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test Command!')
        .addAttachmentOption(option =>
            option.setName('attach')
                .setDescription('Attachment File')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const file = interaction.options.getAttachment('attach');
        
        try {
            const s3Data = await uploadImageToS3(file.url, process.env.AWS_S3_BUCKET_NAME);
            const emb = new EmbedBuilder()
                .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setTitle('Embed Message /w attachment')
                .setDescription('Attachment uploaded successfully!')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setImage(s3Data.Location)
                .setFooter({ text: 'Successfully uploaded', iconURL: user.displayAvatarURL({ dynamic: true }) });

            await interaction.editReply({ embeds: [emb] });
        } catch (error) {
            console.error('Error uploading to S3:', error);
            await interaction.editReply({ content: 'Failed to upload attachment.' });
        }
    },
};
