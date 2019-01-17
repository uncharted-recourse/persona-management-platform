const eventHandler = require('./event-handler');

/* const {
  initSocialConsumer,
  addPersonIfNotExists,
} = require('./social-update-consumer');

const {
  publishEntityUpdate,
  publishEntityView,
  sanitizeDocument,
  initUpdateProducer,
  capitalizeFirstLetter,
} = require('./entity-update-producer'); */

const { connectDatabase, createConnectionString } = require('./connect-database');

const {
  addPersona,
  addPersonaConnection,
  addFieldOrElement,
  deleteArrayElement,
  deletePersona,
  deleteField,
  getAllPersonas,
  getBatchInfoById,
  getPersona,
  editField,
  isNewSocialProfile,
  publishNewEntity,
} = require('./route-controller');

module.exports = {
  //addPersonIfNotExists,
  addPersona,
  addPersonaConnection,
  addFieldOrElement,
  //capitalizeFirstLetter,
  connectDatabase,
  createConnectionString,
  deleteArrayElement,
  deletePersona,
  deleteField,
  editField,
  eventHandler,
  getAllPersonas,
  getBatchInfoById,
  getPersona,
  //initSocialConsumer,
  //initUpdateProducer,
  isNewSocialProfile,
  //publishEntityUpdate,
  //publishEntityView,
  //sanitizeDocument,
  publishNewEntity,
};
