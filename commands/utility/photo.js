const { SlashCommandBuilder, MessageEmbed } = require('discord.js');

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
        const emb = new MessageEmbed()
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setTitle('Embed Message /w attachment')
            .setDescription('Uploading attachment...')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setImage(file.url)
            .setFooter({ text: 'Successfully uploaded', iconURL: user.displayAvatarURL({ dynamic: true }) });
        
        console.log(emb);
        await interaction.editReply({ embeds: [emb] });
    },
};
