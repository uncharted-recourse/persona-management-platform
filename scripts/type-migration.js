const mongoose = require('mongoose');
//const kafka = require('@new-knowledge/nk-kafka-node');

const { createConnectionString } = require('../controllers');
const {
  personaSchema,
} = require('../models/entity-models');

//const { publishNewEntity } = require('../controllers/route-controller');
//const { initUpdateProducer } = require('../controllers/entity-update-producer');

mongoose.Promise = global.Promise;

exports.up = async () => {
  // Run only after emu and emu-db are up and stable
  await mongoose.connect(createConnectionString(), { useMongoClient: true });
  //await initUpdateProducer();

  //let consumerCounter = 0;
  const updateTopic = process.env.ENTITY_UPDATE_TOPIC || 'db.entities.update';
  //const conusmer = await kafka.createConsumer([{ topic: updateTopic }], 'emu-migration');
  /* conusmer.on('message', () => {
    consumerCounter++;
  }); */

  const PersonaModel = await mongoose.model('Persona', personaSchema);

  const personas = await PersonaModel.find();
  for (const persona of personas) {
    persona.set('type', 'persona');
    //persona.set('gender', migrateGender(persona.gender));
    if (persona.connections.length > 0) {
      persona.connections.forEach((connection, index) => {
        const oldConnection = connection.toObject();
        const update = Object.assign({}, oldConnection);
        persona.connections.set(index, update);
      });
    }
    const savedPerson = await persona.save();
    //await publishNewEntity('person', savedPerson, { username: 'migration' });
  };
  console.log('DONE');
  console.log('Migration Complete');
  console.log(`Updated ${personas.length} personas`);
  //console.log(`${consumerCounter} Kafka events sent`);
  return;
};

exports.down = async () => {
  // Run only after emu and emu-db are up and stable
  await mongoose.connect(createConnectionString(), { useMongoClient: true });
  const PersonaModel = await mongoose.model('persona', personaSchema);
  const personas = await PersonaModel.find();
  for (const persona of personas) {
    persona.set('type', 'Persona');
    await persona.save();
  };
  return;
};
/* 
const migrateGender = (gender) => {
  if (gender === '' || gender === undefined) {
    return '';
  }
  const stringArray = gender.split('');
  stringArray[0] = stringArray[0].toUpperCase();
  return stringArray.join('');
}; */

/* const uncapitalize = (inpString) => {
  if (inpString === '' || inpString === undefined) {
    return '';
  }
  const inpArray = inpString.split('');
  inpArray[0] = inpArray[0].toLowerCase();
  return inpArray.join('');
}; */
