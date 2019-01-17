const kafka = require('@new-knowledge/nk-kafka-node');
const { logger } = require('@new-knowledge/logger');
const { addEntity, isNewSocialProfile } = require('./route-controller');

async function initSocialConsumer() {
  const consumer = await kafka.createConsumer([{ topic: process.env.SOCIAL_UPDATE_TOPIC }], 'emu_social_consumer');

  consumer.on('message', async(message) => {
    await addPersonIfNotExists(JSON.parse(message.value));
  });
  consumer.on('error', async(error) => {
    logger.error(error);
  });
};

async function createAndSavePerson(name, url, platform) {
  logger.info(`Creating new entity for social profile ${name}`);
  const newEntity = {
    autoCreated: true,
    socialProfiles: [{ name: name, type: platform, url: url, collect: false }],
  };
  await addEntity('person', newEntity, 'emu-social-listener');
};

async function addPersonIfNotExists(message) {
  // No more than one of the profiles in the relationship will be new, so only check
  // the second profile if the first one already exists. 
  if (await isNewSocialProfile(message['parentScreenName'], message['platform'])) {
    await createAndSavePerson(message['parentScreenName'], message['parentProfileUrl'], message['platform']);
  } else if (await isNewSocialProfile(message['authorScreenName'], message['platform'])) {
    await createAndSavePerson(message['authorScreenName'], message['authorProfileUrl'], message['platform']);
  }
};

module.exports = {
  initSocialConsumer,
  addPersonIfNotExists
};
