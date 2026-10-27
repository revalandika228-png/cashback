const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require("discord.js");

const fs = require("fs");

// ======================
// CONFIG
// ======================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ADMIN_ID = process.env.ADMIN_ID;


// ======================
// CLIENT
// ======================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});


// ======================
// DATABASE
// ======================

let data = {
    pending: {},
    cashback: {},
    messageId: null
};


if (fs.existsSync("./data.json")) {

    try {

        data = JSON.parse(
            fs.readFileSync("./data.json", "utf8")
        );

    } catch (err) {

        console.error(
            "❌ Gagal membaca data.json:",
            err
        );

    }

}

// ======================
// SAVE DATA
// ======================

function saveData() {

    fs.writeFileSync(
        "./data.json",
        JSON.stringify(data, null, 2)
    );

}


// ======================
// FORMAT ANGKA
// ======================

function number(x) {

    return new Intl.NumberFormat(
        "id-ID"
    ).format(x);

}


// ======================
// WAKTU WIB
// ======================

function getWIB() {

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            timeZone: "Asia/Jakarta",
            dateStyle: "full",
            timeStyle: "medium"
        }
    ).format(new Date());

}


// ======================
// NAMA FILE BACKUP
// ======================

function getBackupFileName() {

    const now = new Date();

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Asia/Jakarta",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hourCycle: "h23"
            }
        ).formatToParts(now);

    const get = type =>
        parts.find(
            x => x.type === type
        )?.value;

    return `backup-cashback-${get("year")}-${get("month")}-${get("day")}_${get("hour")}-${get("minute")}-${get("second")}.json`;

}


// ======================
// TIER
// ======================

function getTier(total) {

    if (total >= 2000)
        return {
            emoji: "🔥",
            name: "Cashback Overlord"
        };

    if (total >= 1200)
        return {
            emoji: "👑",
            name: "Cashback Sultan"
        };

    if (total >= 750)
        return {
            emoji: "💎",
            name: "Cashback Elite"
        };

    if (total >= 400)
        return {
            emoji: "🏦",
            name: "Cashback Investor"
        };

    if (total >= 200)
        return {
            emoji: "💰",
            name: "Cashback Grinder"
        };

    if (total >= 75)
        return {
            emoji: "🪙",
            name: "Cashback Hunter"
        };

    if (total >= 25)
        return {
            emoji: "💵",
            name: "Cashback Rookie"
        };

    return {
        emoji: "▫️",
        name: "-"
    };

}

// ======================
// SORT CASHBACK
// ======================

function sortedCashback() {

    return Object.entries(
        data.cashback
    ).sort(
        (a, b) => b[1] - a[1]
    );

}


// ======================
// TOTAL CASHBACK
// ======================

function totalCashback() {

    return Object.values(
        data.cashback
    ).reduce(
        (a, b) => a + b,
        0
    );

}


// ======================
// TOTAL PENDING
// ======================

function totalPending() {

    return Object.values(
        data.pending
    ).reduce(
        (a, b) => a + b,
        0
    );

}


// ======================
// BUTTON BACKUP
// ======================

function backupButtons() {

    const backup =
        new ButtonBuilder()
            .setCustomId("backup_data")
            .setLabel("💾 Amankan Data")
            .setStyle(ButtonStyle.Success);

    return new ActionRowBuilder()
        .addComponents(
            backup
        );

}


// ======================
// BUILD EMBED
// ======================

function buildEmbed() {

    let pendingText = "";
    let cashbackText = "";

    const pendingEntries =
        Object.entries(
            data.pending
        );

    const cashbackEntries =
        sortedCashback();


    // ======================
    // PENDING
    // ======================

    if (
        pendingEntries.length === 0
    ) {

        pendingText =
            "Tidak ada pending.";

    } else {

        pendingEntries.sort(
            (a, b) =>
                a[0].localeCompare(b[0])
        );

        for (
            const [nama, jumlah]
            of pendingEntries
        ) {

            pendingText +=
                `• ${nama} — ${number(jumlah)} ⏣\n`;

        }

    }

// ======================
    // CASHBACK
    // ======================

    if (
        cashbackEntries.length === 0
    ) {

        cashbackText =
            "Belum ada data.";

    } else {

        cashbackEntries
            .slice(0, 10)
            .forEach(
                (item, index) => {

                    const nama =
                        item[0];

                    const jumlah =
                        item[1];

                    const tier =
                        getTier(jumlah);

                    let rank;

                    if (index === 0)
                        rank = "🥇";

                    else if (index === 1)
                        rank = "🥈";

                    else if (index === 2)
                        rank = "🥉";

                    else
                        rank = `${index + 1}.`;

                    const shortName =
                        nama.length > 16
                            ? nama.substring(0, 16)
                            : nama;

                    cashbackText +=
`${rank.padEnd(3)} ${shortName.padEnd(16)} ${number(jumlah).padStart(6)} ⏣ ${tier.emoji}
`;

                }
            );


        if (
            cashbackEntries.length > 10
        ) {

            cashbackText +=
                `... dan ${cashbackEntries.length - 10} lainnya`;

        }

    }


    // ======================
    // EMBED
    // ======================

    return new EmbedBuilder()

        .setColor(0x2F3136)

        .setTitle(
            "📊 SALDO CASHBACK"
        )

        .setDescription(`

━━━━━━━━━━━━━━━━━━━━

## ⏳ Pending

${pendingText}

💰 **Total Pending**
${number(totalPending())} ⏣

━━━━━━━━━━━━━━━━━━━━

## 🎁 Cashback Didapat

\`\`\`
${cashbackText}
\`\`\`

━━━━━━━━━━━━━━━━━━━━

👥 **Total User**
${cashbackEntries.length}

🏦 **Total Cashback**
${number(totalCashback())} ⏣

━━━━━━━━━━━━━━━━━━━━

💾 **DATA AMAN**

Gunakan tombol di bawah untuk
mengirim salinan database ke DM.

`)

        .setFooter({
            text:
                "Pelacak Saldo • Auto Update"
        })

        .setTimestamp();

}

// ======================
// SLASH COMMANDS
// ======================

const commands = [

    new SlashCommandBuilder()

        .setName("pending")

        .setDescription(
            "Tambah pending user"
        )

        .addStringOption(
            option =>
                option
                    .setName("nama")
                    .setDescription(
                        "Nama user"
                    )
                    .setRequired(true)
        )

        .addIntegerOption(
            option =>
                option
                    .setName("jumlah")
                    .setDescription(
                        "Jumlah cashback"
                    )
                    .setRequired(true)
        ),


    new SlashCommandBuilder()

        .setName("cair")

        .setDescription(
            "Cairkan cashback"
        )

        .addStringOption(
            option =>
                option
                    .setName("nama")
                    .setDescription(
                        "Nama user"
                    )
                    .setRequired(true)
                    .setAutocomplete(true)
        )

        .addIntegerOption(
            option =>
                option
                    .setName("jumlah")
                    .setDescription(
                        "Jumlah cashback"
                    )
                    .setRequired(true)
        ),


    new SlashCommandBuilder()

        .setName("edit")

        .setDescription(
            "Edit jumlah cashback user"
        )

        .addStringOption(
            option =>
                option
                    .setName("nama")
                    .setDescription(
                        "Nama user"
                    )
                    .setRequired(true)
                    .setAutocomplete(true)
        )

        .addIntegerOption(
            option =>
                option
                    .setName("jumlah")
                    .setDescription(
                        "Jumlah baru"
                    )
                    .setRequired(true)
        ),


    new SlashCommandBuilder()

        .setName("hapus")

        .setDescription(
            "Hapus user"
        )

        .addStringOption(
            option =>
                option
                    .setName("nama")
                    .setDescription(
                        "Nama user"
                    )
                    .setRequired(true)
                    .setAutocomplete(true)
        ),


    new SlashCommandBuilder()

        .setName("cek")

        .setDescription(
            "Lihat data user"
        )

        .addStringOption(
            option =>
                option
                    .setName("nama")
                    .setDescription(
                        "Nama user"
                    )
                    .setRequired(true)
                    .setAutocomplete(true)
        ),


    new SlashCommandBuilder()

        .setName("reset")

        .setDescription(
            "Reset semua data"
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),


    new SlashCommandBuilder()

        .setName("export")

        .setDescription(
            "Export database"
        )

].map(
    cmd => cmd.toJSON()
);


// ======================
// REGISTER COMMAND
// ======================

const rest =
    new REST({
        version: "10"
    })
    .setToken(TOKEN);


(async () => {

    try {

        console.log(
            "Register Slash Command..."
        );

        await rest.put(

            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),

            {
                body: commands
            }

        );

        console.log(
            "✅ Slash Command berhasil didaftarkan."
        );

    } catch (err) {

        console.error(err);

    }

})();

// ======================
// UPDATE EMBED
// ======================

async function updateEmbed() {

    const channel =
        await client.channels.fetch(
            CHANNEL_ID
        );

    let message = null;


    if (data.messageId) {

        try {

            message =
                await channel.messages.fetch(
                    data.messageId
                );

        } catch {

            message = null;

        }

    }


    // ======================
    // BUAT PESAN
    // ======================

    if (!message) {

        message =
            await channel.send({

                embeds: [
                    buildEmbed()
                ],

                components: [
                    backupButtons()
                ]

            });


        data.messageId =
            message.id;

        saveData();

    }


    // ======================
    // EDIT PESAN
    // ======================

    else {

        await message.edit({

            embeds: [
                buildEmbed()
            ],

            components: [
                backupButtons()
            ]

        });

    }

}


// ======================
// READY
// ======================

client.once(
    "ready",
    async () => {

        console.log(
            "================================"
        );

        console.log(
            `✅ Login sebagai ${client.user.tag}`
        );

        console.log(
            "💾 Sistem Backup Data Aktif"
        );

        console.log(
            "================================"
        );

        await updateEmbed();

    }
);

// ======================
// AUTOCOMPLETE
// ======================

client.on(
    "interactionCreate",
    async interaction => {

        if (
            !interaction.isAutocomplete()
        )
            return;


        const focused =
            interaction.options.getFocused();


        const users = [

            ...Object.keys(
                data.pending
            ),

            ...Object.keys(
                data.cashback
            )

        ];


        const unique =
            [...new Set(users)];


        const filtered =
            unique

                .filter(
                    x =>
                        x.toLowerCase()
                            .includes(
                                focused.toLowerCase()
                            )
                )

                .slice(0, 25)

                .map(
                    x => ({
                        name: x,
                        value: x
                    })
                );


        await interaction.respond(
            filtered
        );

    }
);


// ======================
// INTERACTION
// ======================

client.on(
    "interactionCreate",
    async interaction => {

        try {

            // ======================
            // BUTTON BACKUP
            // ======================

            if (
                interaction.isButton() &&
                interaction.customId === "backup_data"
            ) {

                if (
                    interaction.user.id !== ADMIN_ID
                ) {

                    return interaction.reply({

                        content:
                            "❌ Kamu bukan admin bot.",

                        ephemeral: true

                    });

                }


                // Simpan terbaru
                saveData();


                const backupName =
                    getBackupFileName();


                // Buat file backup sementara
                const backupPath =
                    `./${backupName}`;


                fs.copyFileSync(
                    "./data.json",
                    backupPath
                );


                const waktu =
                    getWIB();


                await interaction.user.send({

                    content:
`💾 **BACKUP DATA BERHASIL**

📅 Waktu backup:
**${waktu}**

📦 File:
**${backupName}**

🔐 Simpan file ini di tempat yang aman.
Ini berisi database cashback bot.`,

                    files: [
                        backupPath
                    ]

                });


                // Hapus file sementara
                fs.unlinkSync(
                    backupPath
                );


                return interaction.reply({

                    content:
`✅ Data berhasil diamankan.

📅 **${waktu}**
📦 **${backupName}**

File backup sudah dikirim ke DM kamu.`,

                    ephemeral: true

                });

            }

// ======================
            // CHAT INPUT
            // ======================

            if (
                !interaction.isChatInputCommand()
            )
                return;


            // ======================
            // ADMIN
            // ======================

            if (
                interaction.user.id !== ADMIN_ID
            ) {

                return interaction.reply({

                    content:
                        "❌ Kamu bukan admin bot.",

                    ephemeral: true

                });

            }


            const nama =
                interaction.options.getString(
                    "nama"
                );

            const jumlah =
                interaction.options.getInteger(
                    "jumlah"
                );


            // ======================
            // /PENDING
            // ======================

            if (
                interaction.commandName === "pending"
            ) {

                if (
                    !data.pending[nama]
                )
                    data.pending[nama] = 0;


                data.pending[nama] +=
                    jumlah;


                saveData();

                await updateEmbed();


                return interaction.reply({

                    content:
`✅ Pending **${nama}** ditambah **${number(jumlah)} ⏣**.`,

                    ephemeral: true

                });

            }


            // ======================
            // /CAIR
            // ======================

            if (
                interaction.commandName === "cair"
            ) {

                if (
                    !data.pending[nama]
                ) {

                    return interaction.reply({

                        content:
                            "❌ User tidak memiliki pending.",

                        ephemeral: true

                    });

                }


                if (
                    data.pending[nama] < jumlah
                ) {

                    return interaction.reply({

                        content:
                            "❌ Pending tidak mencukupi.",

                        ephemeral: true

                    });

                }


                data.pending[nama] -=
                    jumlah;


                if (
                    data.pending[nama] <= 0
                )
                    delete data.pending[nama];


                if (
                    !data.cashback[nama]
                )
                    data.cashback[nama] = 0;


                data.cashback[nama] +=
                    jumlah;


                saveData();

                await updateEmbed();


                const tier =
                    getTier(
                        data.cashback[nama]
                    );


                return interaction.reply({

                    content:
`💸 Cashback berhasil dicairkan!

👤 ${nama}
➕ +${number(jumlah)} ⏣
🏆 Tier : ${tier.emoji} ${tier.name}
💰 Total Cashback : ${number(data.cashback[nama])} ⏣`,

                    ephemeral: true

                });

            }

// ======================
            // /EDIT
            // ======================

            if (
                interaction.commandName === "edit"
            ) {

                if (
                    data.cashback[nama] === undefined
                ) {

                    return interaction.reply({

                        content:
                            "❌ User tidak ditemukan.",

                        ephemeral: true

                    });

                }


                data.cashback[nama] =
                    jumlah;


                saveData();

                await updateEmbed();


                const tier =
                    getTier(jumlah);


                return interaction.reply({

                    content:
`✏️ Cashback berhasil diubah.

👤 ${nama}
💰 Cashback : ${number(jumlah)} ⏣
🏆 Tier : ${tier.emoji} ${tier.name}`,

                    ephemeral: true

                });

            }


            // ======================
            // /HAPUS
            // ======================

            if (
                interaction.commandName === "hapus"
            ) {

                delete data.pending[nama];

                delete data.cashback[nama];


                saveData();

                await updateEmbed();


                return interaction.reply({

                    content:
                        `🗑️ **${nama}** berhasil dihapus.`,

                    ephemeral: true

                });

            }


            // ======================
            // /CEK
            // ======================

            if (
                interaction.commandName === "cek"
            ) {

                const pending =
                    data.pending[nama] || 0;


                const cashback =
                    data.cashback[nama] || 0;


                const tier =
                    getTier(cashback);


                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setColor(
                                0x5865F2
                            )

                            .setTitle(
                                `👤 ${nama}`
                            )

                            .addFields(

                                {
                                    name:
                                        "⏳ Pending",

                                    value:
                                        `${number(pending)} ⏣`,

                                    inline: true
                                },

                                {
                                    name:
                                        "💰 Cashback",

                                    value:
                                        `${number(cashback)} ⏣`,

                                    inline: true
                                },

                                {
                                    name:
                                        "🏆 Tier",

                                    value:
                                        `${tier.emoji} ${tier.name}`,

                                    inline: false
                                }

                            )

                    ],

                    ephemeral: true

                });

            }

 // ======================
            // /RESET
            // ======================

            if (
                interaction.commandName === "reset"
            ) {

                data.pending = {};

                data.cashback = {};


                saveData();

                await updateEmbed();


                return interaction.reply({

                    content:
                        "✅ Semua data berhasil direset.",

                    ephemeral: true

                });

            }


            // ======================
            // /EXPORT
            // ======================

            if (
                interaction.commandName === "export"
            ) {

                saveData();


                const backupName =
                    getBackupFileName();


                const backupPath =
                    `./${backupName}`;


                fs.copyFileSync(
                    "./data.json",
                    backupPath
                );


                const waktu =
                    getWIB();


                return interaction.reply({

                    content:
`📦 **Database berhasil diamankan**

📅 ${waktu}
📄 ${backupName}`,

                    files: [
                        backupPath
                    ],

                    ephemeral: true

                });

            }

        } catch (err) {

            console.error(
                "❌ Interaction Error:",
                err
            );

        }

    }
);


// ======================
// ERROR HANDLER
// ======================

process.on(
    "unhandledRejection",
    console.error
);

process.on(
    "uncaughtException",
    console.error
);


// ======================
// LOGIN
// ======================

client.login(TOKEN);