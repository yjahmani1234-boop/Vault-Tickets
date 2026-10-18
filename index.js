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
    
    // إذا ضغط على زر "بدء الجحفلة"
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

    // إذا عبي البيانات وضغط إرسال
    if (interaction.isModalSubmit() && interaction.customId === 'nuke_modal') {
        const botToken = interaction.fields.getTextInputValue('bot_token');
        const guildId = interaction.fields.getTextInputValue('guild_id');

        // ⚠️ التعديل هنا: نرد فوراً عشان ما يطلع خطأ "didn't respond in time"
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
                    { label: 'حذف كل الرومات', value: 'delete_channels', emoji: '🗑️' },
                    { label: 'سبام رومات ورسائل', value: 'spam_channels', emoji: '💬' },
                    { label: 'حذف كل الرتب', value: 'delete_roles', emoji: '🛑' },
                    { label: 'طرد كل الأعضاء', value: 'ban_all', emoji: '🔨' },
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء الاتصال بديسكورد.' });
        }
    }

    // إذا اختار نوع التخريب من القائمة
    if (interaction.isStringSelectMenu() && interaction.customId === 'nuke_action') {
        const action = interaction.values[0];
        
        // ⚠️ هنا تضع كود التخريب الفعلي
        if (action === 'delete_channels') {
            await interaction.reply({ content: '🗑️ جاري حذف الرومات... (هنا تحط كود الحذف)', ephemeral: true });
        }
        if (action === 'ban_all') {
            await interaction.reply({ content: '🔨 جاري طرد الأعضاء... (هنا تحط كود الطرد)', ephemeral: true });
        }
        if (action === 'spam_channels') {
            await interaction.reply({ content: '💬 جاري السبام... (هنا تحط كود السبام)', ephemeral: true });
        }
        if (action === 'delete_roles') {
            await interaction.reply({ content: '🛑 جاري حذف الرتب... (هنا تحط كود الحذف)', ephemeral: true });
        }
    }
});

// سطر الحماية عشان Render ما يطفي البوت
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
