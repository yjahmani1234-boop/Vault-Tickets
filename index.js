const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, ChannelType, StringSelectMenuBuilder } = require('discord.js');
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
    console.log(`[+] Vault Tickets is online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // أمر إنشاء لوحة التكتات
    if (message.content === '!ticket_panel') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 مركز الدعم - Vault')
            .setDescription('**مرحباً بك في سيرفر Vault!**\n\nاضغط على الزر في الأسفل لفتح تذكرة والتفاعل مع الإدارة.')
            .setColor(0x8B5CF6)
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2885/2885417.png');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket_menu')
                .setLabel('فتح تذكرة')
                .setEmoji('🎫')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        message.delete().catch(()=>{});
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    
    // 1. الضغط على زر فتح التذكرة
    if (interaction.isButton() && interaction.customId === 'open_ticket_menu') {
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_type')
            .setPlaceholder('اختر نوع التذكرة...')
            .addOptions([
                { label: 'دعم فني', description: 'استفسارات أو مشاكل', value: 'support', emoji: '🛠️' },
                { label: 'جحفلة (Nuke)', description: 'طلب نيوك سيرفر', value: 'nuke', emoji: '💀' },
                { label: 'فحص ملفات', description: 'فحص ملف أو أداة', value: 'scan', emoji: '🔍' },
                { label: 'طلب أداة', description: 'شراء أداة', value: 'order', emoji: '🛒' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({ content: 'الرجاء اختيار نوع التذكرة:', components: [row], ephemeral: true });
    }

    // 2. اختيار النوع وفتح الروم
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type') {
        const type = interaction.values[0];
        const user = interaction.user;
        const guild = interaction.guild;

        await interaction.reply({ content: '⏳ جاري فتح تذكرتك...', ephemeral: true });

        try {
            // إنشاء الروم
            const ticketChannel = await guild.channels.create({
                name: `${type}-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                ],
            });

            // تجهيز النص حسب النوع
            let welcomeText = "Support will be with you shortly.";
            if (type === 'nuke') {
                welcomeText = "أهلاً بك في تكت **الجحفلة**.\n\nحط **توكن البوت** و **ايدي السيرفر** عشان نبدأ.";
            } else if (type === 'scan') {
                welcomeText = "أهلاً بك في تكت **فحص الملفات**.\n\nارفق الملف اللي بدك تفحصه، وسيتم الرد.";
            } else if (type === 'order') {
                welcomeText = "أهلاً بك في تكت **طلب أداة**.\n\nاكتب اسم الأداة اللي بدك ياها.";
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `@${user.username} Welcome`, iconURL: user.displayAvatarURL() })
                .setDescription(welcomeText)
                .setColor(0xFF0000)
                .setFooter({ text: 'Vault Store' });

            const closeButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [closeButton] });
            await interaction.editReply({ content: `✅ تم فتح تذكرتك: ${ticketChannel}` });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ (تأكد من صلاحيات البوت).' });
        }
    }

    // 3. إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 سيتم إغلاق التذكرة بعد 5 ثواني...' });
        setTimeout(() => {
            interaction.channel.delete().catch(()=>{});
        }, 5000);
    }
});

// سطر الحماية عشان Render ما يطفي البوت
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);