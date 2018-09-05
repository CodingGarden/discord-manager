const Discord = require('discord.js');
const client = new Discord.Client();

const commands = require('./commands');

const {
  BOT_TOKEN,
  INTRODUCTION_CHANNEL_ID,
  GUILD_ID
} = require('./config');

const germinating = require('./tasks/germinating');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.get(GUILD_ID);
  if (guild.id === GUILD_ID) {
    germinating.addMissingGerminators(guild);
    germinating.listenCodeOfConductReactions(guild);
  }
});

client.on('guildMemberAdd', (member) => {
  if (member.guild.id === GUILD_ID) { 
    germinating.moveToGerminating(member);
  }
});

client.on('message', (message) => {
  const { guild, channel, author } = message;
  if (message.author.bot || channel.type === 'dm') return;

  if (guild && guild.id === GUILD_ID) {
    if (channel.id === INTRODUCTION_CHANNEL_ID) {
      germinating.checkIntroMessage(message, guild, author);
    } else if (message.content[0] === '!') {
      const command = message.content.split(' ')[0].substr(1);
      commands.handle(command, message);
    }
  }
});

client.login(BOT_TOKEN);
