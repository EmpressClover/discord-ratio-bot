# Discord Ratio Bot ✨

A simple Discord bot that helps track win/loss ratios for your server members.

## Features 🌟

- **Track Win/Loss Ratios**: Keep track of wins and losses for each player
- **Season System**: Archive and reset stats with a seasonal system
- **Multiple Updates**: Add multiple wins/losses in a single command
- **Clean Display**: View nicely formatted statistics sorted by winrate
- **Server Specific**: Each Discord server maintains its own separate stats

## Commands 📝

### General Commands
- `!ratio help` - Display all available commands
- `!ratio list` - Show current season's ratios sorted by winrate

### Admin Commands
- `!ratio <name>` - Register a new player
- `!ratio <name> win/loss` - Add a win or loss for a player
- `!ratio <name1> win/loss <name2> win/loss...` - Add multiple wins/losses at once
- `!ratio reset` - Reset current season and archive it
- `!ratio season list` - View all previous seasons
- `!ratio season <number>` - View stats from a specific season

## Setup Guide 🚀

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Discord bot and get your token from the [Discord Developer Portal](https://discord.com/developers/applications)
4. Replace 'YOUR_BOT_TOKEN' in index.js with your bot token, it's at the very bottom of the file
5. Run the bot:
   ```bash
   npm start
   ```

## Dependencies 📦
- discord.js: ^14.14.1
- Node.js: >=16.x

## Support 💕

If you have any questions or feature requests, feel free to reach out to me on Discord: `lilyakane`

## License 📜

This project is licensed under the ISC License.

---
Created with by lilyakane 
