const gen = require('./create-components');
const _ = require('lodash');
/* const { reasonsForInclusion } = require('./metadata');

const races = ['Ewok', 'Tuskan', 'Hutt', 'Sarlacc', 'Wookie', 'Yuuzhan'];
const genders = ['Male', 'Female', 'Other']; */

/* const makeArray = (func, nMax = 3) => {
  const nElements = _.random(0, nMax - 1);
  const elements = Array(nElements).fill().map(() => func());
  elements.unshift(func(true)); // add primary if one is asked for
  return elements;
}; */

// TODO valid connections, per property/type notes

/* function createBaseEntity() {
  return {
    names: makeArray(gen.createName),
    addresses: makeArray(gen.createAddress),
    threat: _.random(0, 100),
    notes: makeArray(gen.createNote),
    // connections: makeArray(gen.createConnection),
  };
};
 */
function createPersona() {
  return {
    names: gen.createName(),
    socialProfiles: gen.createSocialProfile(),
    weights: gen.createWeights(),
    //reasonForInclusion: _.sample(reasonsForInclusion['person']).value,
    //phones: makeArray(gen.createPhoneNumber),
    //emails: makeArray(gen.createEmail),
    //dob: gen.createDate(),
    //race: _.sample(races),
    //gender: _.sample(genders),
  };
};

/* function createPlace() {
  const base = createBaseEntity();
  return {
    ...base,
    reasonForInclusion: _.sample(reasonsForInclusion['place']).value,
    phones: makeArray(gen.createPhoneNumber),
  };
};

function createEvent() {
  const base = createBaseEntity();
  return {
    ...base,
    reasonForInclusion: _.sample(reasonsForInclusion['event']).value,
    timespans: makeArray(gen.createDuration),
  };
};

function createCommunitiy() {
  const base = createBaseEntity();
  // TODO Use community-specific reasonsForInclusion
  return {
    ...base,
    reasonForInclusion: _.sample(reasonsForInclusion['place']).value,
    phones: makeArray(gen.createPhoneNumber),
  };
}; */

const typeToCreateFunc = {
  persona: createPersona,
  /* place: createPlace,
  event: createEvent,
  community: createCommunitiy */
};

module.exports = {
  createPersona,
  /* createPlace,
  createEvent, */
  typeToCreateFunc,
};