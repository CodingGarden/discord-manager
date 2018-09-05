const Discord = require('discord.js');
const client = new Discord.Client();

const db = require('./db');

const {
  WELCOME_CHANNEL_ID,
  INTRODUCTION_CHANNEL_ID,
  CODE_OF_CONDUCT_MESSAGE_ID,
  GERMINATING_ROLE_ID,
  SEEDLING_ROLE_ID,
  GUILD_ID,
  MIN_INTRO_MESSAGE_LENGTH
} = require('./config');

async function checkMoveToSeedling(guildMember, property) {
  const germinatingRole = guildMember.roles.get(GERMINATING_ROLE_ID);
  if (germinatingRole) {
    const info = await db.update({
      _id: guildMember.id
    }, {
      $set: {
        [property]: true
      }
    }, {
      returnUpdatedDocs: true
    });

    if (info && info.codeOfConduct && info.introduction) {
      addToSeedling(guildMember);
    }
  }
}

async function addToSeedling(guildMember) {
  await Promise.all([
    guildMember.addRole(SEEDLING_ROLE_ID),
    guildMember.removeRole(GERMINATING_ROLE_ID)
  ]);
  console.log(guildMember.user.username, 'has become a seedling!');
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.get(GUILD_ID);
  const welcomeChannel = guild.channels.get(WELCOME_CHANNEL_ID);
  
  const message = await welcomeChannel.fetchMessage(CODE_OF_CONDUCT_MESSAGE_ID);
  const collector = message.createReactionCollector(_ => true);
  collector.on('collect', async (reaction) => {
    const guildMembers = await Promise.all(reaction.users.map(user => guild.fetchMember(user)));
    guildMembers.forEach(async (guildMember) => {
      checkMoveToSeedling(guildMember, 'codeOfConduct');
    });
  });
});

client.on('guildMemberAdd', async (member) => {
  const guild = client.guilds.get(GUILD_ID);
  
  if (member.guild.id === GUILD_ID) {
    console.log(member.user.username, 'just joined the server!');
    const germinatingRole = guild.roles.get(GERMINATING_ROLE_ID);
    
    try {
      await Promise.all([
        member.addRole(germinatingRole),
        db.update({
          _id: member.user.id,
        }, {
          _id: member.user.id,
          codeOfConduct: false,
          introduction: false
        }, {
          upsert: true
        })
      ]);
      console.log(member.user.username, 'added to germinating role!');
      console.log(member.user.username, 'inserted into DB!');
    } catch (error) {
      console.error('Error moving', member.user.username, 'to germinating role.');
      console.error(error);
    }
  }
});

client.on('message', async (message) => {
  if (message.author.bot) return;

  const { guild, channel, author } = message;
  if (channel.type === 'dm') return;
  
  if (guild && guild.id === GUILD_ID && channel.id === INTRODUCTION_CHANNEL_ID) {
    if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
      const guildMember = await guild.fetchMember(author);
      checkMoveToSeedling(guildMember, 'introduction');
    }
  }
});

client.login(process.env.BOT_TOKEN);
