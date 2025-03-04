const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Hello!
// This is a simple and easy-to-use Discord bot that helps track win/loss ratios for a server.
// It's a straightforward and fully functional bot!
// If you have any requests or questions, feel free to reach out to me on Discord: lilyakane ♥

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const dataPath = path.join(__dirname, 'ratios.json');

// Initialize or load ratios data
let ratios = {};
let seasons = {};
if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    ratios = data.ratios || {};
    seasons = data.seasons || {};
}

// Save ratios and seasons to file
function saveData() {
    fs.writeFileSync(dataPath, JSON.stringify({ ratios, seasons }, null, 2));
}

// Calculate winrate
function calculateWinrate(wins, losses) {
    const total = wins + losses;
    if (total === 0) return 0;
    return (wins / total) * 100;
}

// Add a helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set the bot's status to show the help command
    client.user.setActivity('!ratio help', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!ratio') || message.author.bot) return;

    const guildId = message.guild.id;
    if (!ratios[guildId]) {
        ratios[guildId] = {};
    }
    if (!seasons[guildId]) {
        seasons[guildId] = [];
    }

    const args = message.content.split(' ');
    const command = args[1]?.toLowerCase();

    // Add help command
    if (command === 'help') {
        const helpMessage = `
**Ratio Bot Commands**
\`!ratio help\` - Show this help message
\`!ratio <name>\` - Register a new name for ratio tracking (Admin only)
\`!ratio <name> win/loss\` - Add a win/loss for the given name (Admin only)
\`!ratio <name1> win/loss <name2> win/loss...\` - Add multiple wins/losses (Admin only)
\`!ratio list\` - Show all current ratios sorted by winrate
\`!ratio reset\` - Reset current season and save it (Admin only)
\`!ratio season list\` - Show all previous seasons
\`!ratio season <number>\` - Show ratios from a specific season

Created by lilyakane ♥
For support: Contact lilyakane on Discord`;

        message.reply(helpMessage);
        return;
    }

    // Check if user has admin permissions for commands that modify data
    const isAdmin = message.member.permissions.has('Administrator');

    // Handle season-related commands
    if (command === 'reset') {
        if (!isAdmin) {
            message.reply('Only administrators can reset seasons.');
            return;
        }

        // Store current season
        if (Object.keys(ratios[guildId]).length > 0) {
            const seasonNumber = seasons[guildId].length + 1;
            seasons[guildId].push({
                number: seasonNumber,
                data: JSON.parse(JSON.stringify(ratios[guildId])), // Deep copy
                date: new Date().toISOString()
            });
        }

        // Reset current ratios
        ratios[guildId] = {};
        saveData();
        message.reply(`Season reset complete! New season started. Previous season stored as Season ${seasons[guildId].length}`);
        return;
    }

    if (command === 'season') {
        const subCommand = args[2]?.toLowerCase();
        
        if (subCommand === 'list') {
            if (seasons[guildId].length === 0) {
                message.reply('No previous seasons found.');
                return;
            }

            const seasonList = seasons[guildId].map(season => {
                const date = new Date(season.date).toLocaleDateString();
                return `Season ${season.number} (${date})`;
            }).join('\n');

            message.reply(`Previous Seasons:\n${seasonList}`);
            return;
        }

        const seasonNumber = parseInt(args[2]);
        if (!isNaN(seasonNumber)) {
            const season = seasons[guildId].find(s => s.number === seasonNumber);
            if (!season) {
                message.reply(`Season ${seasonNumber} not found.`);
                return;
            }

            const sortedRatios = Object.entries(season.data)
                .map(([name, stats]) => ({
                    name,
                    ...stats,
                    winrate: calculateWinrate(stats.wins, stats.losses)
                }))
                .sort((a, b) => b.winrate - a.winrate);

            const list = sortedRatios.map(({ name, wins, losses, winrate }) => 
                `${name}: ${wins}W/${losses}L (${winrate.toFixed(2)}% winrate)`
            ).join('\n');

            const date = new Date(season.date).toLocaleDateString();
            message.reply(`Season ${seasonNumber} (${date}):\n${list}`);
            return;
        }
    }

    if (args.length === 2 && command !== 'list') {
        // Register new name - requires admin
        if (!isAdmin) {
            message.reply('Only administrators can register new ratios.');
            return;
        }

        const name = capitalizeFirstLetter(command);
        if (!ratios[guildId][name]) {
            ratios[guildId][name] = { wins: 0, losses: 0 };
            saveData();
            message.reply(`Registered new ratio tracking for ${name}`);
        } else {
            message.reply(`${name} already exists with ${ratios[guildId][name].wins}W/${ratios[guildId][name].losses}L`);
        }
    } else if (command === 'list') {
        // List all ratios - anyone can view :)
        const sortedRatios = Object.entries(ratios[guildId])
            .map(([name, stats]) => ({
                name: capitalizeFirstLetter(name),
                ...stats,
                winrate: calculateWinrate(stats.wins, stats.losses),
                total: stats.wins + stats.losses
            }))
            .sort((a, b) => b.winrate - a.winrate);

        if (sortedRatios.length === 0) {
            message.reply('No ratios registered yet!');
            return;
        }

        const header = '**Current Season Ratios**\n';
        
        const list = sortedRatios.map(({ name, wins, losses, winrate, total }, index) => {
            return `#${index + 1}. ${name} [Wins: ${wins}] [Losses: ${losses}] [Win Rate: ${winrate.toFixed(2)}%] [Total Games: ${total}]`;
        }).join('\n');

        message.reply(header + list);
    } else {
        // Handle multiple updates or single update
        if (!isAdmin) {
            message.reply('Only administrators can add wins and losses.');
            return;
        }

        // Process each name-action pair
        const updates = [];
        for (let i = 1; i < args.length; i += 2) {
            const name = capitalizeFirstLetter(args[i]);
            const action = args[i + 1]?.toLowerCase();

            if (!action) {
                message.reply(`Missing win/loss action for ${name}`);
                return;
            }

            if (!ratios[guildId][name]) {
                message.reply(`${name} is not registered. Use !ratio ${name} to register first.`);
                return;
            }

            if (action === 'win') {
                ratios[guildId][name].wins++;
                updates.push(`Added win for ${name}`);
            } else if (action === 'loss') {
                ratios[guildId][name].losses++;
                updates.push(`Added loss for ${name}`);
            } else {
                message.reply(`Invalid action '${action}' for ${name}. Use 'win' or 'loss'.`);
                return;
            }
        }

        saveData();
        message.reply(updates.join('\n'));
    }
});

// Replace 'YOUR_BOT_TOKEN' with your Discord bot token
// Created by lilyakane, if you have any requests or questions, please contact me on discord: lilyakane
client.login('bot token'); 