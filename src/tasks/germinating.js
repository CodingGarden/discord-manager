const db = require('../db');

const reactions = {};
const introductions = {};

const {
  INTRODUCTION_CHANNEL_ID,
  GERMINATING_ROLE_ID,
  WELCOME_CHANNEL_ID,
  CODE_OF_CONDUCT_MESSAGE_ID,
  SEEDLING_ROLE_ID,
  MIN_INTRO_MESSAGE_LENGTH,
  WELCOME_MESSAGE
} = require('../config');

async function getAllIntros(guild) {
  console.log('Start get all intros.');
  const introChannel = guild.channels.get(INTRODUCTION_CHANNEL_ID);
  let loadedAllMessages = false;
  let before;

  while(!loadedAllMessages) {
    const messages = await introChannel.fetchMessages({
      limit: 50,
      before,
    });
    messages.tap((message) => {
      if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
        introductions[message.author.id] = true;
      }
    });
    before = messages.lastKey(1)[0];

    if ([...messages.keys()].length < 50) {
      loadedAllMessages = true;
    }
  }
  
  console.log('Got all intros.');
  return introductions;
}

async function getAllReactions(guild) {
  console.log('Start get all reactions');
  
  const welcomeChannel = guild.channels.get(WELCOME_CHANNEL_ID);
  const message = await welcomeChannel.fetchMessage(CODE_OF_CONDUCT_MESSAGE_ID);

  await Promise.all(message.reactions.map(async (messageReaction) => {
    let users = await messageReaction.fetchUsers();
    users.tap(({ id }) => {
      reactions[id] = true;
    });
    if ([...users.keys()].length === 100) {
      let finished = false;
      while (!finished) {
        users = await messageReaction.fetchUsers(100, {
          after: users.lastKey(1)[0],
        });
        users.tap(({ id }) => {
          reactions[id] = true;
        });
        if ([...users.keys()].length < 100) finished = true;
      }
    }
  }));

  console.log('Got all reactions.');
  return reactions;
}

async function addMissingGerminators(guild) {
  const germinatingRole = guild.roles.get(GERMINATING_ROLE_ID);

  await guild.fetchMembers();

  const promises = [];

  guild.members.tap((member) => {
    introductions[member.id] = false;
    reactions[member.id] = false;
    if ([...member.roles.keys()].length === 1) {
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

  console.log(allReactions.length, ' total guild members.');
  console.log(allReactions.filter(r => r).length, ' have acknowledged the code of conduct.');
  console.log(allReactions.filter(r => !r).length, ' have NOT acknowledged the code of conduct.');
  console.log(allIntroductions.filter(i => i).length, ' have introduced themselves.');
  console.log(allIntroductions.filter(i => !i).length, ' have NOT introduced themselves.');

  return Promise.all(
    germinatingRole.members.map(async (member) => {
      const codeOfConduct = reactions[member.id] || false;
      const introduction = introductions[member.id] || false;
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
}

async function moveToGerminating(member) {
  console.log(member.user.username, 'just joined the server!');
  if (reactions[member.id] && introductions[member.id]) {
    console.log(member.user.username, 'has been here before!');
    await member.addRole(SEEDLING_ROLE_ID);
    console.log(member.user.username, 'has become a seedling!');
    const introChannel = member.guild.channels.get(INTRODUCTION_CHANNEL_ID);
    introChannel.send(`Please welcome ${member.user} to the Coding Garden!`);
    return;
  }
  const germinatingRole = member.guild.roles.get(GERMINATING_ROLE_ID);
  const addRolePromise = member.addRole(germinatingRole);
  const insertDB = await db.update({
    _id: member.user.id,
  }, {
    _id: member.user.id,
    codeOfConduct: false,
    introduction: false
  }, {
    upsert: true
  });
  const dmChannel = await member.createDM();
  dmChannel.send(WELCOME_MESSAGE);
  try {
    await addRolePromise;
    console.log(member.user.username, 'added to germinating role!');
  }
  catch (error) {
    console.error('Error moving', member.user.username, 'to germinating role.');
    console.error(error);
  }
  try {
    await insertDB;
    console.log(member.user.username, 'inserted into DB!');
  }
  catch (error) {
    console.error('Error inserting', member.user.username, 'into DB.');
    console.error(error);
  }
}

async function listenCodeOfConductReactions(guild) {
  const welcomeChannel = guild.channels.get(WELCOME_CHANNEL_ID);
  const message = await welcomeChannel.fetchMessage(CODE_OF_CONDUCT_MESSAGE_ID);
  const collector = message.createReactionCollector(() => true);
  collector.on('collect', async (reaction) => {
    const guildMembers = await Promise.all(reaction.users.map(user => guild.fetchMember(user)));
    await Promise.all(guildMembers.map(async (guildMember) => {
      reactions[guildMember.id] = true;
      await checkMoveToSeedling(guildMember, 'codeOfConduct');
    }));
  });
}

async function checkIntroMessage(message, guild, author) {
  if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
    const guildMember = await guild.fetchMember(author);
    introductions[guildMember.id] = true;
    await checkMoveToSeedling(guildMember, 'introduction');
  }
}

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
      upsert: true,
      returnUpdatedDocs: true
    });

    if (info && info.codeOfConduct && info.introduction) {
      await addToSeedling(guildMember);
    }
  }
}

async function addToSeedling(guildMember) {
  const addRolePromise = guildMember.addRole(SEEDLING_ROLE_ID);
  const removeRolePromise = guildMember.removeRole(GERMINATING_ROLE_ID);

  const introChannel = guildMember.guild.channels.get(INTRODUCTION_CHANNEL_ID);
  introChannel.send(`Please welcome ${guildMember.user} to the Coding Garden!`);

  try {
    await addRolePromise;
    console.log(guildMember.user.username, 'has become a seedling!');
    await db.remove({
      _id: guildMember.id
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
