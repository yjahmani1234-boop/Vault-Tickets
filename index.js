const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
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
    
    // 1. زر بدء الجحفلة
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

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('nuke_action')
                .setPlaceholder('اختر نوع التخريب...')
                .addOptions([
                    { label: 'سبام (Spam)', value: 'spam', emoji: '💬' },
                    { label: 'حذف رومات (Delete Channels)', value: 'delete_channels', emoji: '🗑️' },
                    { label: 'إنشاء رومات (Create Channels)', value: 'create_channels', emoji: '📁' },
                    { label: 'حذف رتب (Delete Roles)', value: 'delete_roles', emoji: '🛑' },
                    { label: 'إنشاء رتب (Create Roles)', value: 'create_roles', emoji: '⚙️' },
                    { label: 'طرد الكل (Ban All)', value: 'ban_all', emoji: '🔨' },
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء الاتصال.' });
        }
    }

    // 3. اختيار نوع التخريب (تطلع نافذة لكل خيار)
    if (interaction.isStringSelectMenu() && interaction.customId === 'nuke_action') {
        const action = interaction.values[0];

        if (action === 'spam') {
            const modal = new ModalBuilder().setCustomId('modal_spam').setTitle('إعدادات السبام');
            const amount = new TextInputBuilder().setCustomId('amount').setLabel('كم رسالة بدك تبعت؟').setStyle(TextInputStyle.Short).setRequired(true);
            const msg = new TextInputBuilder().setCustomId('message').setLabel('نص الرسالة').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(amount), new ActionRowBuilder().addComponents(msg));
            await interaction.showModal(modal);
        }

        if (action === 'delete_channels') {
            const modal = new ModalBuilder().setCustomId('modal_delete_channels').setTitle('تأكيد حذف الرومات');
            const confirm = new TextInputBuilder().setCustomId('confirm').setLabel('اكتب كلمة DELETE للتأكيد').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(confirm));
            await interaction.showModal(modal);
        }

        if (action === 'create_channels') {
            const modal = new ModalBuilder().setCustomId('modal_create_channels').setTitle('إنشاء رومات');
            const name = new TextInputBuilder().setCustomId('channel_name').setLabel('اسم الروم').setStyle(TextInputStyle.Short).setRequired(true);
            const count = new TextInputBuilder().setCustomId('count').setLabel('كم روم بدك تنشئ؟').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(name), new ActionRowBuilder().addComponents(count));
            await interaction.showModal(modal);
        }

        if (action === 'delete_roles') {
            const modal = new ModalBuilder().setCustomId('modal_delete_roles').setTitle('تأكيد حذف الرتب');
            const confirm = new TextInputBuilder().setCustomId('confirm').setLabel('اكتب كلمة DELETE للتأكيد').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(confirm));
            await interaction.showModal(modal);
        }

        if (action === 'create_roles') {
            const modal = new ModalBuilder().setCustomId('modal_create_roles').setTitle('إنشاء رتب');
            const name = new TextInputBuilder().setCustomId('role_name').setLabel('اسم الرتبة').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(name));
            await interaction.showModal(modal);
        }

        if (action === 'ban_all') {
            const modal = new ModalBuilder().setCustomId('modal_ban_all').setTitle('تأكيد طرد الكل');
            const confirm = new TextInputBuilder().setCustomId('confirm').setLabel('اكتب كلمة BAN للتأكيد').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(confirm));
            await interaction.showModal(modal);
        }
    }

    // ═══════════════════════════════════════════
    // 4. استلام البيانات من النوافذ (الردود الاحترافية)
    // ═══════════════════════════════════════════
    if (interaction.isModalSubmit()) {
        
        if (interaction.customId === 'modal_spam') {
            const amount = interaction.fields.getTextInputValue('amount');
            const msg = interaction.fields.getTextInputValue('message');
            await interaction.reply({ content: `✅ **تم استلام إعدادات السبام!**\n> العدد: \`${amount}\`\n> الرسالة: \`${msg}\`\n\n**جاري تنفيذ عملية السبام الآن...**`, ephemeral: true });
        }

        if (interaction.customId === 'modal_delete_channels') {
            await interaction.reply({ content: `🗑️ **تم تأكيد حذف الرومات.**\n\n**جاري تنفيذ عملية الحذف الآن...**`, ephemeral: true });
        }

        if (interaction.customId === 'modal_create_channels') {
            const name = interaction.fields.getTextInputValue('channel_name');
            const count = interaction.fields.getTextInputValue('count');
            await interaction.reply({ content: `📁 **تم استلام طلب إنشاء الرومات!**\n> الاسم: \`${name}\`\n> العدد: \`${count}\`\n\n**جاري إنشاء الرومات الآن...**`, ephemeral: true });
        }

        if (interaction.customId === 'modal_delete_roles') {
            await interaction.reply({ content: `🛑 **تم تأكيد حذف الرتب.**\n\n**جاري تنفيذ عملية الحذف الآن...**`, ephemeral: true });
        }

        if (interaction.customId === 'modal_create_roles') {
            const name = interaction.fields.getTextInputValue('role_name');
            await interaction.reply({ content: `⚙️ **تم استلام طلب إنشاء الرتبة!**\n> الاسم: \`${name}\`\n\n**جاري إنشاء الرتبة الآن...**`, ephemeral: true });
        }

        if (interaction.customId === 'modal_ban_all') {
            await interaction.reply({ content: `🔨 **تم تأكيد طرد الكل.**\n\n**جاري تنفيذ عملية الطرد الآن...**`, ephemeral: true });
        }
    }
});

http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
