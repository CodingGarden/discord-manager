const db = require('../db');

const {
  INTRODUCTION_CHANNEL_ID,
  GERMINATING_ROLE_ID,
  WELCOME_CHANNEL_ID,
  CODE_OF_CONDUCT_MESSAGE_ID,
  SEEDLING_ROLE_ID,
  MIN_INTRO_MESSAGE_LENGTH,
  WELCOME_MESSAGE
} = require('../config');

async function addMissingGerminators(guild) {
  const welcomeChannel = guild.channels.get(WELCOME_CHANNEL_ID);
  const introChannel = guild.channels.get(INTRODUCTION_CHANNEL_ID);
  const germinatingRole = guild.roles.get(GERMINATING_ROLE_ID);

  const cocMessage = await welcomeChannel.fetchMessage(CODE_OF_CONDUCT_MESSAGE_ID);

  const [reactionUsers, introMessages] = await Promise.all([
    Promise.all(cocMessage.reactions.map(reaction => reaction.fetchUsers())),
    introChannel.fetchMessages()
  ]);

  const validIntrosByUser = introMessages.reduce((byUser, message) => {
    if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
      byUser[message.author.id] = true;
    }
    return byUser;
  }, {});

  return Promise.all(
    germinatingRole.members.map(async (member) => {
      const codeOfConduct = reactionUsers.some(collection => collection.get(member.id));
      const introduction = !!validIntrosByUser[member.id];
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
        addToSeedling(member);
      } else {
        console.log('Updated germinator in db:', member.user.username);
        console.log(info);
      }
    })
  );
}

async function moveToGerminating(member) {
  console.log(member.user.username, 'just joined the server!');
  const germinatingRole = member.guild.roles.get(GERMINATING_ROLE_ID);
  const addRolePromise = member.addRole(germinatingRole);
  const insertDB = db.update({
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
  }
}

async function listenCodeOfConductReactions(guild) {
  const welcomeChannel = guild.channels.get(WELCOME_CHANNEL_ID);
  const message = await welcomeChannel.fetchMessage(CODE_OF_CONDUCT_MESSAGE_ID);
  const collector = message.createReactionCollector(_ => true);
  collector.on('collect', async (reaction) => {
    const guildMembers = await Promise.all(reaction.users.map(user => guild.fetchMember(user)));
    guildMembers.forEach(async (guildMember) => {
      checkMoveToSeedling(guildMember, 'codeOfConduct');
    });
  });
}

async function checkIntroMessage(message, guild, author) {
  if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
    const guildMember = await guild.fetchMember(author);
    checkMoveToSeedling(guildMember, 'introduction');
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
      addToSeedling(guildMember);
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
  }

  try {
    await removeRolePromise;
    console.log(guildMember.user.username, 'has been removed from germinating!');
  } catch (error) {
    console.error('Error removing', guildMember.user.username, 'from germinating role!');
  }
}

module.exports = {
  moveToGerminating,
  listenCodeOfConductReactions,
  checkIntroMessage,
  addMissingGerminators
};
