const { SlashCommandBuilder, MessageEmbed } = require('discord.js');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
//test

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const S3 = new AWS.S3();

async function uploadImageToS3(imageUrl, bucketName) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const imageBuffer = await response.buffer();

    const imageKey = `images/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;

    return new Promise((resolve, reject) => {
        S3.upload({
            Bucket: bucketName,
            Key: imageKey,
            Body: imageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read',
        }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
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
            const emb = new MessageEmbed()
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
