const _ = require('lodash');
const moment = require('moment');
const faker = require('faker');

let { socialProfileTypes } = require('./metadata');
socialProfileTypes = socialProfileTypes.map(t => t.value);

function randString() {
  return Math.random().toString(36).substring(7);
};

/* function createAddress(primary = false) {
  const { fromDate, toDate } = createDuration();
  return {
    primary,
    fromDate,
    toDate,
    streetNumber: _.random(10, 9999),
    streetName: faker.address.streetName(),
    city: faker.address.city(),
    state: faker.address.state(),
    zipCode: faker.address.zipCode('#####'),
  };
}

function createDate() {
  return moment.utc()
    .subtract(_.random(10, 50), _.sample(['days', 'months', 'years']))
    .format(); //'YYYY-MM-DD-kk:mm:ss');
}

function createDuration() {
  const from = moment.utc().subtract(_.random(60, 1000), 'days');
  const fromDate = from.format();
  const toDate = from.add(_.random(1, 60), 'days').format();
  return {
    fromDate, //'YYYY-MM-DD-kk:mm:ss'
    toDate, //'YYYY-MM-DD-kk:mm:ss'
  };
}

function createEmail(primary = false) {
  return {
    address: faker.internet.email(),
    primary,
  };
} */

function createName(primary = false) {
  return {
    primary,
    firstName: faker.name.firstName(),
    middleName: faker.name.firstName(),
    lastName: faker.name.lastName(),
  };
}

function createWeights() {
  return {
    filename: "ppdb-l2018-11-26_16-41-17_200-0.6008.h5",
    type: 'h5',
  };
}

/* function createNote() {
  return {
    author: faker.internet.userName(),
    content: faker.lorem.sentences(),
    // property: _.sample(model.paths.filter(p => p != '_id')),
    // propertyValue: JSON.stringify({ prop: 'value' }),  // TODO use valid value here
  };
}

function createPhoneNumber(primary = false) {
  return {
    number: parseInt(faker.phone.phoneNumberFormat().replace(/-/g, '')),
    primary
  };
}; */

// TODO use real profiles here to test scraping?
function createSocialProfile() {
  return {
    name: faker.internet.userName(),

    type: _.sample(socialProfileTypes),
    url: faker.internet.url(),
    collect: true,
  };
};

/* function createUser() {
  return {
    name: faker.internet.userName(),
  };
}; */

// TODO use valid entity Ids for toEntityId
function createConnection() {
  return {
    toEntityId: faker.random.uuid(), // TODO valid mongo ids
  };
}

module.exports = {
  //createAddress,
  createConnection,
  /* createDate,
  createDuration,
  createEmail, */
  createName,
  createWeights,
  /* createNote,
  createPassportNumber,
  createPhoneNumber,
  createPublicRecord, */
  createSocialProfile,
  // createSSN,
  // createUser,
  // createVehicle,
};
