const mongoose = require('mongoose');
const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const kafka = require('kafka-node');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  createPerson,
  createPlace,
  createEvent,
  entityTypes,
  seed,
  typeToCreateFunc,
} = require('../utils');
const {
  createName,
} = require('../utils/create-components');
chai.use(chaiHttp);
chai.should();


const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

describe('Kafka message production for posts and updates \n\n', function () {

  this.timeout(5000);

  const topic = process.env.ENTITY_CHANGE_TOPIC;

  let app;
  // let client;
  // let consumer;
  const nEntities = 1;
  const baseEntities = {};
  let latestOffset;

  before(async function () {
    app = require('../app');
    await seed(nEntities);

    const client = new kafka.Client('zookeeper:2181');
    Promise.promisifyAll(client);
    await client.refreshMetadataAsync([topic]);  // weird kafka-node workaround, ow get broker errors

    entityTypes.forEach(async type => {
      baseEntities[type] = await mongoose.model(type).findOne();
    });

    const offset = new kafka.Offset(client);
    Promise.promisifyAll(offset);
    latestOffset = (await offset.fetchLatestOffsetsAsync([topic]))[topic][0];
    // console.log('latest offset', latestOffset);
  });


  describe('Kafka message production for posts and updates \n\n', function () {

    for (const type of entityTypes) {

      let client;
      let consumer;
      let tempEntity;
      beforeEach(async function () {
        client = new kafka.Client('zookeeper:2181');
        consumer = new kafka.Consumer(
          client,
          [{ topic, offset: latestOffset }],
          { groupId: `${type}Group`, fromOffset: true }
        );
        consumer.on('error', (err) => {
          console.log('consumer error:', err);
          throw err;
        });

        const ent = typeToCreateFunc[type]();
        const res = await chai.request(app).post(`/${type}`).send(ent);  // add an entity to be deleted
        tempEntity = JSON.parse(res.text);
      });

      it(`a message should be published to kafka when ${type} are added`, function (done) {

        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });

        const newEntity = typeToCreateFunc[type]();
        chai.request(app).post(`/${type}`).send(newEntity)
          .then(() => { })  // need to then this async call or mocha hangs
          .catch(err => { console.log(err.message); assert(false); });
      });

      it(`a message should be published to kafka when ${type} are updated`, function (done) {

        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });

        // const entity = baseEntities[type];
        const update = typeToCreateFunc[type]();
        chai.request(app).put(`/${type}/${tempEntity._id}`).send(update)
          .then(() => { }) // need to then this async call or mocha hangs
          .catch(err => { console.log(err.message); assert(false); });
      });

      it(`should publish when making a post req to '/:${type}/:id/:field' where field is top-level for type ${type}`, function (done) {
        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });

        // const entity = baseEntities[type];
        chai.request(app).post(`/${type}/${tempEntity._id}/rfi`).send({ rfi: 'super cool' })
          .then(() => { })
          .catch(err => { console.log(err.message); assert(false); });
      });


      // router.put(`/:entityType${types}/:id/:field`, catchErrorAsync(updateEntityField)); 
      it(`should publish when making a post req to '/:${type}/:id/:arrayField' where field is a arrayField`, function (done) {

        console.log('test posting to array field');

        consumer.once('message', function (msg) {
          console.log('array field addition message received');
          latestOffset = msg.offset;
          done();
        });

        // const entity = baseEntities[type];
        const newName = createName();
        chai.request(app).post(`/${type}/${tempEntity._id}/names`).send(newName)
          .then(() => { console.log('req complete'); })
          .catch(err => { console.log(err.message); assert(false); });
      });

      it(`should publish when making a put request to '/:${type}/:id/:arrayField' to update an array element`, function (done) {
        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });

        const entity = baseEntities[type];
        const i = _.random(0, entity.names.length - 1);
        const uid = entity.names[i]._id;
        const updatedName = createName();
        chai.request(app).put(`/${type}/${entity._id}/names/${uid}`).send(updatedName)
          .then(() => { })
          .catch(err => { console.log(err.message); assert(false); });
      });

    }

  });
});
