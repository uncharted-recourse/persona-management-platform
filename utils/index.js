const initServer = require('./init-server');
/* const { seedDatabase } = require('./seed');

const { createName } = require('./create-components');
const {
  createPerson,
  createPlace,
  createEvent,
  typeToCreateFunc,
} = require('./create-entities'); */
const retryFunction = require('./retry-function');
// const seed = require('./seed');

module.exports = {
  /* createEvent,
  createName,
  createPerson,
  createPlace, */
  initServer,
  retryFunction,
  /* seed,
  seedDatabase,
  typeToCreateFunc, */
};