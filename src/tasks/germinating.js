const db = require('../db');

const {
  INTRODUCTION_CHANNEL_ID,
  MOD_ROLE_ID,
  GERMINATING_ROLE_ID,
  WELCOME_CHANNEL_ID,
  CODE_OF_CONDUCT_MESSAGE_ID,
  SEEDLING_ROLE_ID,
  BOT_LOG_CHANNEL_ID,
  MIN_INTRO_MESSAGE_LENGTH,
  WELCOME_MESSAGE
} = require('../config');

const reactions = {};
const introductions = {};

async function logBotMessage(guild, ...args) {
  const botChannel = guild.channels.cache.get(BOT_LOG_CHANNEL_ID);
  botChannel.send(args.join(' '));
  console.log(...args);
}

async function getAllIntros(guild) {
  logBotMessage(guild, 'Start get all intros.');
  const introChannel = guild.channels.cache.get(INTRODUCTION_CHANNEL_ID);
  let loadedAllMessages = false;
  let before;

  while(!loadedAllMessages) {
    const messages = await introChannel.messages.fetch({
      limit: 50,
      before,
    });
    messages.each((message) => {
      if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
        introductions[message.author.id] = true;
      }
    });
    before = messages.lastKey(1)[0];

    if ([...messages.keys()].length < 50) {
      loadedAllMessages = true;
    }
  }
  
  logBotMessage(guild, 'Got all intros.');
  return introductions;
}

async function getAllReactions(guild) {
  logBotMessage(guild, 'Start get all reactions');
  
  const welcomeChannel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
  const message = await welcomeChannel.messages.fetch(CODE_OF_CONDUCT_MESSAGE_ID);

  await Promise.all(message.reactions.cache.map(async (messageReaction) => {
    let users = await messageReaction.users.fetch();
    await validateReactions(users, guild, messageReaction);
    if ([...users.keys()].length === 100) {
      let finished = false;
      while (!finished) {
        users = await messageReaction.users.fetch(100, {
          after: users.lastKey(1)[0],
        });
        await validateReactions(users, guild, messageReaction);
        if ([...users.keys()].length < 100) finished = true;
      }
    }
  }));

  logBotMessage(guild, 'Got all reactions.');
  return reactions;
}

async function validateReactions(users, guild, messageReaction) {
  return Promise.all(users.map(async (user) => {
    try {
      await guild.members.fetch(user);
      reactions[user.id] = true;
    }
    catch (error) {
      if (error.message.includes('Unknown Member')) {
        try {
          logBotMessage(guild, 'Unknown Member: ', user.id, 'Removing reaction: ', messageReaction.emoji.name);
          await messageReaction.remove(user);
        }
        catch (error) {
          console.error('error removing reaction', error.message);
        }
      }
    }
  }));
}

async function addMissingGerminators(guild) {
  logBotMessage(guild, 'Bot restarted.');
  const germinatingRole = guild.roles.cache.get(GERMINATING_ROLE_ID);


  await guild.members.fetch();

  const promises = [];

  guild.members.cache.each((member) => {
    introductions[member.user.id] = false;
    reactions[member.user.id] = false;
    if (!member.roles.cache.has(SEEDLING_ROLE_ID)
      && !member.roles.cache.has(GERMINATING_ROLE_ID)
      && !member.roles.cache.has(MOD_ROLE_ID)) {
      promises.push(moveToGerminating(member));
    }
  });

  await Promise.all(promises);

  await Promise.all([
    getAllReactions(guild),
    getAllIntros(guild)
  ]);

  const allReactions = Object.values(reactions);
  const allIntroductions = Object.values(introductions);

  logBotMessage(guild, allReactions.length, ' total guild members.');
  logBotMessage(guild, allReactions.filter(r => r).length, ' have acknowledged the code of conduct.');
  logBotMessage(guild, allReactions.filter(r => !r).length, ' have NOT acknowledged the code of conduct.');
  logBotMessage(guild, allIntroductions.filter(i => i).length, ' have introduced themselves.');
  logBotMessage(guild, allIntroductions.filter(i => !i).length, ' have NOT introduced themselves.');

  await Promise.all(
    germinatingRole.members.map(async (member) => {
      const codeOfConduct = reactions[member.user.id] || false;
      const introduction = introductions[member.user.id] || false;
      const info = await db.update({
        _id: member.user.id
      },{
        _id: member.user.id,
        codeOfConduct,
        introduction
      }, {
        upsert: true,
        returnUpdatedDocs: true
      });
      if (info && info.codeOfConduct && info.introduction) {
        await addToSeedling(member);
      }
    })
  );
  logBotMessage(guild, 'Ready!');
}

async function moveToGerminating(member) {
  logBotMessage(member.guild, member.user.username, 'just joined the server!');
  if (reactions[member.user.id] && introductions[member.user.id]) {
    logBotMessage(member.guild, member.user.username, 'has been here before!');
    await member.roles.add(SEEDLING_ROLE_ID);
    logBotMessage(member.guild, member.user.username, 'has become a seedling!');
    const introChannel = member.guild.channels.cache.get(INTRODUCTION_CHANNEL_ID);
    introChannel.send(`Please welcome ${member.user} to the Coding Garden!`);
    return;
  }
  const germinatingRole = member.guild.roles.cache.get(GERMINATING_ROLE_ID);
  const addRolePromise = member.roles.add(germinatingRole);
  const insertDB = await db.update({
    _id: member.user.id,
  }, {
    _id: member.user.id,
    codeOfConduct: false,
    introduction: false
  }, {
    upsert: true
  });
  try {
    const dmChannel = await member.createDM();
    dmChannel.send(WELCOME_MESSAGE);
  } catch (error) {
    logBotMessage(member.guild, 'error sending Welcome DM to', member.user.username);
    console.error(error);
  }
  try {
    const dmChannel = await member.createDM();
    dmChannel.send(WELCOME_MESSAGE);
  } catch (error) {
    logBotMessage(member.guild, 'error sending Welcome DM to', member.user.username);
    console.error(error);
  }
  try {
    await addRolePromise;
    logBotMessage(member.guild, member.user.username, 'added to germinating role!');
  }
  catch (error) {
    logBotMessage(member.guild, 'Error moving', member.user.username, 'to germinating role.', error.message);
    console.error(error);
  }
  try {
    await insertDB;
    logBotMessage(member.guild, member.user.username, 'inserted into DB!');
  }
  catch (error) {
    console.error('Error inserting', member.user.username, 'into DB.');
    console.error(error);
  }
}

async function listenCodeOfConductReactions(guild) {
  const welcomeChannel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
  const message = await welcomeChannel.messages.fetch(CODE_OF_CONDUCT_MESSAGE_ID);
  const collector = message.createReactionCollector(() => true);
  collector.on('collect', async (reaction, member) => {
    const user = member;
    try {
      logBotMessage(guild, user.username, 'reacted to Code of Conduct with', reaction.emoji.name);
      const guildMember = await guild.members.fetch(user);
      reactions[guildMember.user.id] = true;
      await checkMoveToSeedling(guildMember, 'codeOfConduct');  
    } catch (error) {
      console.log('error checking reaction for user', user);
      console.error(error); 
    }
  });
}

async function checkIntroMessage(message, guild, author) {
  if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
    const guildMember = await guild.members.fetch(author);
    introductions[guildMember.user.id] = true;
    logBotMessage(guild, guildMember.user.username, 'sent a valid intro message of length', message.content.length);
    await checkMoveToSeedling(guildMember, 'introduction');
    logBotMessage(guild, guildMember.user.username, 'sent a valid intro message of length', message.content.length);
  }
}

async function checkMoveToSeedling(guildMember, property) {
  const germinatingRole = guildMember.roles.cache.get(GERMINATING_ROLE_ID);
  if (germinatingRole) {
    const info = await db.update({
      _id: guildMember.user.id
    }, {
      $set: {
        [property]: true
      }
    }, {
      upsert: true,
      returnUpdatedDocs: true
    });

    if (info && info.codeOfConduct && info.introduction) {
      await addToSeedling(guildMember);
    }
  }
}

async function addToSeedling(guildMember) {
  const addRolePromise = guildMember.roles.add(SEEDLING_ROLE_ID);
  const removeRolePromise = guildMember.roles.remove(GERMINATING_ROLE_ID);

  const introChannel = guildMember.guild.channels.cache.get(INTRODUCTION_CHANNEL_ID);
  introChannel.send(`Please welcome ${guildMember.user} to the Coding Garden!`);

  try {
    await addRolePromise;
    logBotMessage(guildMember.guild, guildMember.user.username, 'has become a seedling!');
    await db.remove({
      _id: guildMember.user.id
    });
  } catch (error) {
    console.error('Error adding', guildMember.user.username, 'to seedling role!');
    console.error(error);
  }

  try {
    await removeRolePromise;
    console.log(guildMember.user.username, 'has been removed from germinating!');
  } catch (error) {
    console.error('Error removing', guildMember.user.username, 'from germinating role!');
    console.error(error);
  }
}

module.exports = {
  moveToGerminating,
  listenCodeOfConductReactions,
  checkIntroMessage,
  addMissingGerminators
};
