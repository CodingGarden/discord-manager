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

async function getAllIntros(guild) {
  const introChannel = guild.channels.get(INTRODUCTION_CHANNEL_ID);
  const intros = {};
  let loadedAllMessages = false;
  let before;

  while(!loadedAllMessages) {
    const messages = await introChannel.fetchMessages({
      limit: 50,
      before,
    });
    messages.tap((message) => {
      if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
        intros[message.author.id] = true;
      }
    });
    before = messages.lastKey(1)[0];

    if ([...messages.keys()].length < 50) {
      loadedAllMessages = true;
    }
  }

  return intros;
}

async function getAllReactions(guild) {
  const welcomeChannel = guild.channels.get(WELCOME_CHANNEL_ID);
  const message = await welcomeChannel.fetchMessage(CODE_OF_CONDUCT_MESSAGE_ID);

  const reacted = {};

  await Promise.all(message.reactions.map(async (messageReaction) => {
    const users = await messageReaction.fetchUsers();
    users.tap(({ id }) => {
      reacted[id] = true;
    });
    if ([...users.keys()].length === 100) {
      let finished = false;
      while (!finished) {
        const moreUsers = await messageReaction.fetchUsers(100, {
          after: users.lastKey(1)[0],
        });
        moreUsers.tap(({ id }) => {
          reacted[id] = true;
        });
        if ([...moreUsers.keys()].length < 100) finished = true;
      }
    }
  }));

  return reacted;
}

async function addMissingGerminators(guild) {
  const germinatingRole = guild.roles.get(GERMINATING_ROLE_ID);

  await guild.fetchMembers();

  const promises = [];

  guild.members.tap((member) => {
    if ([...member.roles.keys()].length === 1) {
      promises.push(moveToGerminating(member));
    }
  });

  await Promise.all(promises);

  const reactions = await getAllReactions(guild);
  const intros = await getAllIntros(guild);

  return Promise.all(
    germinatingRole.members.map(async (member) => {
      const codeOfConduct = reactions[member.id] || false;
      const introduction = intros[member.id] || false;
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
      await checkMoveToSeedling(guildMember, 'codeOfConduct');
    }));
  });
}

async function checkIntroMessage(message, guild, author) {
  if (message.content.length >= MIN_INTRO_MESSAGE_LENGTH) {
    const guildMember = await guild.fetchMember(author);
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
