const mongoose = require('mongoose');
const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const kafka = require('kafka-node');
const Promise = require('bluebird');
const {
  createPerson,
  createPlace,
  createEvent,
  entityTypes,
  seed,
  typeToCreateFunc,
} = require('../utils');
chai.use(chaiHttp);
chai.should();


describe('Kafka message production for deletes \n\n', function () {

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


  // // separating deletes here bc they intefere with tests above in unexpected ways
  describe('Kafka message production for deletes \n\n', function () {

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


      // /:entityType/:id - delete entity
      it("should publish when making a delete request to '/:entityType/:id'", function (done) {
        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });

        chai.request(app).delete(`/${type}/${tempEntity._id}`)
          .then(() => { console.log('delete req complete'); })
          .catch(err => { console.log(err.message); assert(false); });
      });


      // /:entityType/:id/:field - delete entity field
      it("should publish when making delete request to '/:entityType/:id/:field' to delete a field", function (done) {
        console.log('testing field delete');
        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });
        chai.request(app).delete(`/${type}/${tempEntity._id}/rfi`)
          .then(() => { })
          .catch(err => { console.log(err.message); assert(false); });
      });

      // /:entityType/:id/:field/:elementId - delete entity array field member
      it("should publish when making a delete request to '/:entityType/:id/:field/:elementId' to remove an element from an array field", function (done) {
        console.log('testing array field element delete');
        consumer.once('message', function (msg) {
          latestOffset = msg.offset;
          done();
        });
        const removeId = tempEntity.names[0]._id;
        chai.request(app).delete(`/${type}/${tempEntity._id}/names/${removeId}`)
          .then(() => { })
          .catch(err => { console.log(err.message); assert(false); });
      });

    }
  });
});
