const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
//const { seedDatabase, initServer } = require('../utils/seed');
const { getAllPersonas } = require('../controllers');
const _ = require('lodash');
const {
  createName,
  typeToCreateFunc,
  comparePersonas,
  sleep,
} = require('./tools');

chai.use(chaiHttp);
chai.should();

const types = Object.keys(typeToCreateFunc);
const typesAndPlurals = types.concat(types.map(t => t + 's'));

for (const type of types) typeToCreateFunc[type + 's'] = typeToCreateFunc[type];

describe('Routing \n\n', function () {

  this.timeout(5000);

  let app;
  const seedNumPerType = parseInt(process.env.SEED_NUM);
  before(async function () {
    console.log('init app');
    app = require('../app');
    while (!app.ready) {
      console.log('waiting for app');
      await sleep(1000);
    }

  });

  after(async function () {
    app.server.close();
  });

  // router.get('/', function(req, res)
  it("should be able to make get req to '/' ", async function () {
    console.log('running basic get test');
    const res = await chai.request(app).get('/');
    res.should.have.status(200);
    res.text.should.equal('Persona Management Platform');
  });

  // router.get(`/personas`, catchReqError(getAllPersonas));  // GET all personas of all types
  it("should be able to make get req to '/personas' and get a list of all personas, sorted", async function () {
    const res = await chai.request(app).get('/personas?sort=createdAt');
    res.should.have.status(200);

    const personas = JSON.parse(res.text);
    personas.should.have.length(types.length * seedNumPerType);

    (new Set(personas.map(e => e.type))).size.should.equal(types.length); // should include all persona types

    const sorted = _.sortBy(personas, e => e.createdAt);
    _.isEqual(personas, sorted).should.be.true;
  });

  // router.get(`/:id`, catchReqError(getPersonaById)); // GET a single persona by mongo _id
  it("should be able to make get req to '/:id' and get the persona identified", async function () {
    async function testGetPersonaById(type) {
      const personas = JSON.parse((await chai.request(app).get(`/${type}`)).text);
      const selected = _.sample(personas);
      const res = await chai.request(app).get(`/${selected._id}`);
      res.should.have.status(200);
      const returned = JSON.parse(res.text);
      _.isEqual(returned, selected).should.be.true;
    }
    for (const t of typesAndPlurals) testGetPersonaById(t);
  });

  // router.post(``, catchReqError(addPersona)); // POST a new persona 
  it("should be able to make post req to '' and add a persona", async function () {
    async function testAddPersona(type) {
      const newPersona = typeToCreateFunc[type]();
      const res = await chai.request(app).post(``).send({ json: JSON.stringify(newPersona) });
      res.should.have.status(200);
      const returned = JSON.parse(res.text);
      comparePersonas(newPersona, returned).should.be.true;
    };
    for (const t of typesAndPlurals) await testAddPersona(t);
  });

  async function addPersona(persona) {
    const response = await chai.request(app).post(``).send({ json: JSON.stringify(persona) });
    return JSON.parse(response.text);
  }

  async function getPersona(id) {
    const response = await chai.request(app).get(`/${id}`);
    return JSON.parse(response.text);
  }

  // POST (`/:fromEntityId/addConnection` (addPersonaField). add a new connection to the fromPersona
  it("should be able to make post req to '/:fromEntityId/addConnection' to add a connection between two personas", async function () {

    async function testAddConnection(fromPersona, type) {
      const toPersona = await addPersona(typeToCreateFunc[type]());
      const body = {
        json: JSON.stringify({toEntityId: toPersona._id }),
      };

      const fromPersonaAfter = (await chai.request(app).post(`/${fromPersona._id}/addConnection`).send(body)).body;
      // const fromPersonaAfter = await getEntity(fromPersona._id);

      const connections = fromPersonaAfter.connections;
      const connIndex = connections.findIndex(c => (c.toPersonaId == toPersona._id));
      connIndex.should.not.equal(-1);
      const connection = connections[connIndex];
      connection.should.include({ toPersonaId: toPersona._id });
    };

    for (const fromType of types) {
      const fromPersona = await addPersona(typeToCreateFunc[fromType]());
      for (const type of types) await testAddConnection(fromPersona, type);
    }
  });

  /* it.only("should be able to make a batch id info req using the body of a POST", async function () {

    async function testBatchReq(props) {
      const batchRequest = {};
      for (const type of types) {
        // select a random subset of personas of that type, add their ids as 
        if (Array.isArray(props) || props[type]) {
          batchRequest[type] = {
            props: props[type] || props,
            ids: (await getAllPersonas())
              .filter(e => _.random(0, 1))
              .map(e => String(e._id)) // convert to string else id is object (?)
          };
        }
      }

      const reqTypes = Object.keys(batchRequest);

      const batchResponse = (await chai.request(app).post(`/getBatchInfo`).send({ payload: batchRequest })).body;
      Object.keys(batchResponse).should.have.members(reqTypes); // response is indexed by type

      for (const type in batchResponse) {
        const resIds = Object.keys(batchResponse[type]);
        resIds.should.have.members(batchRequest[type].ids); // type's response should include the personas with the ids given for that type
        for (const id of resIds) {
          const resEnt = batchResponse[type][id];
          Object.keys(resEnt).should.deep.equal(props[type] || props); // each persona should have the requested props
        }
      }
    }

    // should accept an array of props or a mapping from entity types to props array
    const testProps = ['names']
    await testBatchReq(testProps);
    await testBatchReq({ 'person': [...testProps, 'socialProfiles']});
  }); */

  ///// NOTE: tests below are not up to date

  // router.post(`/:id/:field`, catchReqError(addPersonaField)); // POST a new element to top-level field or add element to and array-field of persona
  it("should be able to make post req to '/:id/:field' where field is an arrayField and add an element to the array", async function () {
    const testAddArrayField = async (type, primary) => {
      const persona = typeToCreateFunc[type]();
      const resBefore = await chai.request(app).post(``).send({
        persona,
      });
      const personaBefore = JSON.parse(resBefore.text);

      const newName = createName(primary);
      const resAfter = await chai.request(app).post(`/${personaBefore._id}/names`).send(newName);
      const personaAfter = JSON.parse(resAfter.text);

      personaAfter._id.should.equal(personaBefore._id); // should be the same persona
      personaBefore.names.length.should.equal(personaAfter.names.length - 1);
      const arrayName = (primary) ? personaAfter.names[0] : _.last(personaAfter.names);
      comparePersonas(newName, arrayName).should.be.true;
    };
    for (const primary of [true, false]) {
      for (const t of types) testAddArrayField(t, primary);
    }
  });

  // router.post(`/:id/:field`, catchReqError(addPersonaField)); // POST a new element to top-level field or add element to and array-field of persona
  it("should be able to make post req to '/:id/:field' where field is top-level and set that field", async function () {
    const testAddField = async (type, preExists) => {
      let persona = (preExists) ? { rfi: 'not cool :(' } : {};
      const resBefore = await chai.request(app).post(``).send(persona);
      const personaBefore = JSON.parse(resBefore.text);
      const newRfi = 'super cool!';
      const resAfter = await chai.request(app).post(`/${personaBefore._id}/rfi`).send({ rfi: newRfi });
      const personaAfter = JSON.parse(resAfter.text);

      personaAfter._id.should.equal(personaBefore._id); // should be the same persona
      if (preExists) personaBefore.rfi.should.equal('not cool :(');
      else Object.keys(personaBefore).includes('rfi').should.be.false;
      personaAfter.rfi.should.equal(newRfi);
    };
    for (const preExists of [true, false]) {
      for (const t of types) testAddField(t, preExists);
    }
  });

  // router.put(`/:id`, catchReqError(updatePersonaById));
  it("should be able to make put req to '/:id' and update that persona", async function () {
    const testUpdatePersona = async (type) => {
      const pers = typeToCreateFunc[type]();
      const res = await chai.request(app).post(``).send(pers);
      const persona = JSON.parse(res.text);
      comparePersonas(pers, persona).should.be.true;

      const update = typeToCreateFunc[type]();
      const updateRes = await chai.request(app).put(`/${persona._id}`).send(update);
      const updatePersona = JSON.parse(updateRes.text);
      comparePersonas(update, updatePersona).should.be.true;
      comparePersonas(persona, updatePersona).should.be.false;
    };
    for (const t of types) testUpdatePersona(t);
  });

  // router.put(`/:id/:field`, catchReqError(updatePersonaField)); 
  it("should be able to make a put request to '/:id/:field' and update a top-level field", async function () {
    const testUpdatePersonaField = async (type) => {
      const pers = typeToCreateFunc[type]();
      const res = await chai.request(app).post(``).send(pers);
      const persona = JSON.parse(res.text);
      comparePersonas(pers, persona).should.be.true;

      const update = { rfi: 'super cool!' };
      const updateRes = await chai.request(app).put(`/${persona._id}/rfi`).send(update);
      const updatePersona = JSON.parse(updateRes.text);
      update.rfi.should.equal(updatePersona.rfi);
      update.rfi.should.not.equal(persona.rfi);
    };
    for (const t of types) testUpdatePersonaField(t);
  });

  // router.put(`/:id/:field/:elementId`, catchReqError(updatePersonaFieldMember)); // TODO
  it("should be able to make a put request to '/:id/:arrayField' and update an array element", async function () {
    const testUpdatePersonaArrayField = async (type) => {
      const pers = typeToCreateFunc[type]();
      const res = await chai.request(app).post(``).send(pers);
      const persona = JSON.parse(res.text);
      comparePersonas(pers, persona).should.be.true;

      const i = _.random(0, persona.names.length - 1);
      const uid = persona.names[i]._id;

      const updatedName = createName(i == 0); // primary name if i = 0
      const updateRes = await chai.request(app).put(`/${persona._id}/names/${uid}`).send(updatedName);
      const updatedPersona = JSON.parse(updateRes.text);

      comparePersonas(updatedName, updatedPersona.names[i]).should.be.true;

      comparePersonas(updatedName, persona.names[i]).should.be.false;
      (updatedPersona.names[i]._id == uid).should.be.true;

    };
    for (const t of types) testUpdatePersonaArrayField(t);
  });

  // /:id/:field - delete persona field
  it("should be able to make a delete request to '/:id/:field' and delete that field", async function () {
    const testDeleteField = async (type) => {
      const pers = typeToCreateFunc[type]();
      const res = await chai.request(app).post(``).send(pers);
      const persona = JSON.parse(res.text);

      const response = await chai.request(app).delete(`/${persona._id}/rfi`);
      const retPersona = JSON.parse(response.text);
      assert(retPersona.rfi == undefined);
      comparePersonas(retPersona, persona).should.be.true;
    };
    for (const t of types) testDeleteField(t);
  });

  // /:id/:field/:elementId - delete persona array field member
  it("should be able to make a delete request to '/:id/:field/:elementId' and remove that element from an array field", async function () {
    const testDeleteElement = async (type) => {
      const pers = typeToCreateFunc[type]();
      const res = await chai.request(app).post(``).send(pers);
      const persona = JSON.parse(res.text);

      const removeId = persona.names[0]._id;
      const response = await chai.request(app).delete(`/${persona._id}/names/${removeId}`);
      const retPersona = JSON.parse(response.text);
      const ids = retPersona.names.map(n => n._id);
      ids.includes(removeId).should.be.false;
    };
    for (const t of types) testDeleteElement(t);
  });

/*   it('should be able to recognize a new social profile', async function () {
    // make sure no entity has this social profile
    const { isNewSocialProfile, addPersonIfNotExists } = require('../controllers/socialUpdateListener');

    const username = Date.now().toString();
    const isNew = await isNewSocialProfile(username, 'twitter');
    isNew.should.equal(true);

    // have to do this twice to make sure both are added
    await addPersonIfNotExists({
      authorScreenName: username,
      authorProfileUrl: 'glarb',
      platform: 'twitter',
      parentScreenName: 'test_target',
      parentProfileUrl: 'glarb2'
    });

    await addPersonIfNotExists({
      authorScreenName: username,
      authorProfileUrl: 'glarb',
      platform: 'twitter',
      parentScreenName: 'test_target',
      parentProfileUrl: 'glarb2'
    });

    const isNewNow = await isNewSocialProfile(username, 'twitter');
    isNewNow.should.equal(false);
  }); */

});
