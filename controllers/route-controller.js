const _ = require('lodash');
const { diff } = require('deep-diff');
const mongoose = require('mongoose');
const fs = require('fs');
const grid = require('gridfs-stream');
const { logger } = require('@new-knowledge/logger');
const { InvalidRequestError } = require('request-errors');
const { capitalizeFirstLetter, publishEntityUpdate, publishEntityView, removeEmpty } = require('./entity-update-producer');
const type = 'persona';

// GET /personas
async function getAllPersonas(sort = '-createdAt') {

  let allPersonas = [];
  const Model = mongoose.model(type);
  allPersonas.push(...(await Model.find()));

  if (sort === 'name') {
    return allPersonas.sort((personaA, personaB) => {
      return personaA.names.filter(val => val.primary)[0]['fullName']
        > personaB.names.filter(val => val.primary)[0]['fullName'];
    });
  } else {
    const desc = (sort[0] === '-');
    const sortField = desc ? sort.slice(1) : sort;
    const sortOrder = desc ? 'desc' : 'asc';

    return _.orderBy(allPersonas, sortField, sortOrder);
  }
};

// GET /:personaId
async function getPersona(personaId) {
  /* return entity of given type with given mongo id */
  const Model = mongoose.model(type);
  const persona = await Model.findById(personaId);
  return persona;
};

// GET /:entityId/weights
async function getPersonaWeights(personaId) {
  /* return entity of given type with given mongo id */
  const Model = mongoose.model(type);
  const persona = await Model.findById(personaId);

  // read weights file from database
  const connection = mongoose.connection;
  grid.mongo = mongoose.mongo;
  const gfs = grid(connection.db);
  const fs_write_stream = fs.createWriteStream(persona.weights[0]['filename']);
  const readstream = gfs.createReadStream({
    filename: persona.weights[0]['filename']
  });
  
  // error handling
  readstream.on('error', (err) => logger.error(`An error occured: ${err.message}`));
  readstream.pipe(fs_write_stream);
  fs_write_stream.on('close', () => console.log('file has been fully written'));

  return persona;
};

/* function newPersonaToUpdateEvents(persona) {
  const params = Object.getOwnPropertyNames(persona);
  const updateEvents = [];
  for (const p of params) {
    if (Array.isArray(persona[p])) {
      checkPrimary(persona[p]); // confirm single primary if array not empty
      for (const el of persona[p]) {
        updateEvents.push({ eventType: 'add', field: p, oldValue: null, newValue: el });
      }
    } else updateEvents.push({ eventType: 'add', field: p, oldValue: null, newValue: persona[p] });
  }
  return updateEvents;
} */

/* async function publishNewEntity(entityType, doc, user) {
  // create update events, then publish them
  // const entity = removeEmpty(doc.toObject ? doc.toObject() : doc); //  TODO need remove empty? how about below?
  const entity = removeEmpty(doc._doc || doc); //  TODO need remove empty? how about below?
  const updateEvents = newPersonaToUpdateEvents(entity);
  return publishEntityUpdate(entity, entityType, entity._id, 'add', updateEvents, user);
} */

// POST 
async function addPersona(personaParams) {
  /* Adds entity specified in req, returns object as serialized json */
  personaParams = removeEmpty(personaParams); // strip empty strings and array objects

  if (personaParams.weights) {

    // write weights file to database
    const connection = mongoose.connection;
    grid.mongo = mongoose.mongo;
    const gfs = grid(connection.db);
    const writestream = gfs.createWriteStream({
      filename: personaParams.weights['filename']
    });
    const rs = fs.createReadStream("/app/" + personaParams.weights['filename'], {encoding: 'binary'});
    rs.on('open', () => {
      rs.pipe(writestream);
    });
    rs.on('error', (err) => {
      logger.error(`An error occured: ${err.message}`);
    });
    writestream.on('close', function (file) {
      console.log(file.filename + ' written to database');
    });
  }
  const Model = mongoose.model(type);
  let mongoosePersona = new Model(personaParams);
  mongoosePersona = await mongoosePersona.save(); // get post-save entity (contains props set by plugin)
  // create update events, then publish them
  const persona = removeEmpty(mongoosePersona._doc); //  TODO need remove empty? how about below?
  // publishNewEntity(entityType, entity, user);

  return persona;
};

// POST /:fromPersonaId/addConnection
async function addPersonaConnection(fromPersonaId, connection) {
  const Model = mongoose.model(type);
  let fromPersona = await Model.findById(fromPersonaId);

  const connections = fromPersona.connections;
  if (connections) {
    if (!connections.some(c => _.isEqual(_.pick(c, ['toPersonaId']), connection))) {
      connections.push(connection);
    } else logger.warn('WARNING: attempting to add edge that already exists');
  } else fromPersona.connections = [connection];
  fromPersona = await fromPersona.save();

  // grab connection from doc returned by mongoose save so values set by plugins are included
  const newValue = fromPersona.connections.slice(-1)[0];
  //const updateEvents = [{ eventType: 'add', field: 'connections', oldValue: null, newValue }];
  //publishEntityUpdate(fromPersona, fromEntityType, fromEntityId, 'change', updateEvents, user);

  return fromPersona;
}

// POST /:entityId/:field
async function addFieldOrElement(personaId, field, newValue) {
  /* Add a new top-level field or add an element to an array-field */
  if (newValue[field]) newValue = newValue[field];
  //if (field === 'notes') newValue[0]['author'] = user.username; // TODO move to route middleware to be used on several routes
  const Model = mongoose.model(type);
  let persona = await Model.findById(personaId);
  const currentVal = persona[field];
  if (currentVal) {
    if (Array.isArray(currentVal)) {
      // if (newValue.primary) currentVal.unshift(newValue);
      persona[field].push(newValue);
    } else return Promise.reject(new InvalidRequestError(
      'Trying to POST to a non-array field that already exists, use PUT request to update'));
  } else {
    persona.set(field, newValue);
  }
  persona = await persona.save();

  // grab new value from doc returned by mongoose save so values set by plugins are included
  newValue = Array.isArray(persona[field]) ? persona[field].slice(-1)[0] : persona[field];

  //const updateEvents = [{ eventType: 'add', field, oldValue: null, newValue }];
  //publishEntityUpdate(entity, entityType, entityId, 'change', updateEvents, user);

  return persona;
}

// PUT /:entityId/:field
async function editField(personaId, field, newValue) {
  if (newValue[field] || newValue[field] === '') newValue = newValue[field];
  //if (field === 'notes') newValue[0]['author'] = user.username; // TODO move to route middleware to be used on several routes

  /* update a top-level field w/ request given mongo id */
  const Model = mongoose.model(type);
  let persona = await Model.findById(personaId);
  if (!persona.toObject().hasOwnProperty(field)) return Promise.reject(new InvalidRequestError('Trying to update an undefined field'));

  const oldValue = _.cloneDeep(persona[field]);

  if (Array.isArray(newValue)) checkPrimary(newValue); // confirm single primary if array not empty

  persona.set(field, newValue);
  persona = await persona.save();

  // grab new value from doc returned by mongoose save so values set by plugins are included
  newValue = persona[field];
  /* const updateEvents = (Array.isArray(newValue))
    ? parseArrayUpdate(oldValue, newValue, field)
    : [{ eventType: 'changeValue', field, oldValue, newValue }];

  publishEntityUpdate(entity, entityType, entityId, 'change', updateEvents, user); */

  return persona;
}

// DELETE /:entityId  - delete persona by id
async function deletePersona(personaId) {
  const Model = mongoose.model(type);
  const mongooseEntity = await Model.findByIdAndRemove(personaId);

  const persona = mongooseEntity._doc;
  //const params = Object.getOwnPropertyNames(persona);
  //const updateEvents = [];
  /* for (const p of params) {
    if (Array.isArray(persona[p])) {
      for (const el of persona[p]) {
        updateEvents.push({ eventType: 'remove', field: p, oldValue: el, newValue: null });
      }
    } else updateEvents.push({ eventType: 'remove', field: p, oldValue: entity[p], newValue: null });
  }
  publishEntityUpdate(entity, entityType, entityId, 'remove', updateEvents, user); */

  return persona;
};

// DELETE  /:personaId/:field - delete persona field
async function deleteField(personaId, field) {
  const Model = mongoose.model(type);
  let persona = await Model.findById(personaId);
  //const oldValue = _.cloneDeep(persona[field]);

  if (Array.isArray(persona[field])) persona.set(field, []);
  else persona.set(field, undefined);
  persona = await persona.save();

  /* const updateEvents = [];
  if (Array.isArray(oldValue)) {
    for (const el of oldValue) {
      updateEvents.push({ eventType: 'remove', field, oldValue: el, newValue: null });
    }
  } else updateEvents.push({ eventType: 'remove', field, oldValue, newValue: null });

  publishEntityUpdate(entity, entityType, entityId, 'change', updateEvents, user); */

  return persona;
};

//  /:personaId/:field/:elementId - delete persona array field element
async function deleteArrayElement(personaId, field, elementId) {
  const Model = mongoose.model(type);
  let persona = await Model.findById(personaId);

  if (!Array.isArray(persona[field])) return Promise.reject(
    new InvalidRequestError('Trying to delete an array element of a non-array field'));

  //const arrayField = persona[field];
  //const oldValue = arrayField.filter(el => String(el._id) == elementId)[0];
  persona[field].remove(elementId);
  persona = await persona.save();

  //const updateEvents = [{ eventType: 'remove', field, oldValue, newValue: null }];
  //publishEntityUpdate(entity, entityType, entityId, 'change', updateEvents, user);

  return persona;
}

// returns object of the form {id : {prop0: value0, prop1: value1}}
async function getBatchInfoById(ids, props) {
  const Model = mongoose.model(type);
  const personas = await Model.find({ '_id': { $in: ids } });
  return personas.reduce((propsById, persona) =>
    ({ ...propsById, [persona._id]: selectProperties(persona, props) }), {});
}

// props is an array of strings -- to req primary of array field, use primaryOfProp
function selectProperties(doc, props = 'all') {
  if (props == 'all') return doc;
  else if (!Array.isArray(props) || props.length == 0) throw new InvalidRequestError(`properties to select is not an array or is empty: ${props}`);

  const primaryProps = props
    .filter(p => p.slice(0, 9) == 'primaryOf')
    .map(p => p.slice(9).toLowerCase());
  const otherProps = props.filter(n => !primaryProps.includes(n));

  const result = _.pick(doc, otherProps); // pick non-primary props off document
  // for properties where the primary element is requested, extract that element
  for (const prop of primaryProps) {
    if (Array.isArray(doc[prop])) {
      const primaryProp = 'primaryOf' + capitalizeFirstLetter(prop);
      const primaryElement = doc[prop].find(e => e.primary);
      if (primaryElement != undefined) {
        result[primaryProp] = primaryElement;
      } else {
        if (doc[prop].length > 0) {
          logger.warn(`WARNING: requested primary element of non-empty array field ${prop}, which has no primary -- returning first element`);
          result[primaryProp] = doc[prop][0];
        } else {
          logger.warn(`WARNING: requested primary element of empty array field ${prop} -- returning null`);
          result[primaryProp] = null;
        }

      }
    } else return Promise.reject(new InvalidRequestError('requested primary element of non-array object')); // TODO throw or return rejected promise here?
  }

  return result;
}

/* function parseArrayUpdate(oldArray, newArray, field) {
  const mapDocToJSON = (el) => {
    if (el._doc) {
      return Object.assign({}, el.toObject(), { sanitized: el.sanitize() });
    }
    return el;
  };
  oldArray = oldArray.map(mapDocToJSON); // use el._doc if it exists
  newArray = newArray.map(mapDocToJSON);
  const oldIds = oldArray.map(a => String(a._id));
  const newIds = newArray.map(a => String(a._id));
  const removedIds = oldIds.filter(id => !newIds.includes(id));
  const addedIds = newIds.filter(id => !oldIds.includes(id));
  const keptIds = newIds.filter(id => oldIds.includes(id));

  const oldIdMap = _.zipObject(oldIds, oldArray);
  const newIdMap = _.zipObject(newIds, newArray);
  const oldEditIdMap = _.pick(oldIdMap, keptIds);
  const newEditIdMap = _.pick(newIdMap, keptIds);

  const excludeProps = ['__parentArray', '__parent', '$__', '$init', 'primary'];
  // TODO deep diff is overkill here, use _.deepEqual?
  const deepDiff = diff(oldEditIdMap, newEditIdMap, (path, key) => excludeProps.includes(key));
  const editIds = (deepDiff) ? new Set(deepDiff.map(d => d.path[0])) : [];

  const updateEvents = [];
  for (const id of editIds) {
    const eventType = 'changeValue';
    updateEvents.push({ eventType, field, oldValue: oldEditIdMap[id], newValue: newEditIdMap[id] });
  }

  for (const id of addedIds) {
    const eventType = 'add';
    updateEvents.push({ eventType, field, oldValue: null, newValue: newIdMap[id] });
  }

  for (const id of removedIds) {
    const eventType = 'remove';
    updateEvents.push({ eventType, field, oldValue: oldIdMap[id], newValue: null });
  }

  const oldPrimaries = oldArray.filter(el => el.primary == true);
  const newPrimaries = newArray.filter(el => el.primary == true);
  const oldPrimaryId = (oldPrimaries.length == 1) ? String(oldPrimaries[0]._id) : '';
  const newPrimaryId = (newPrimaries.length == 1) ? String(newPrimaries[0]._id) : '';

  if (oldPrimaryId && newPrimaryId && (oldPrimaryId != newPrimaryId)) {
    const eventType = 'changePrimary';
    updateEvents.push({ eventType, field, oldValue: oldIdMap[oldPrimaryId], newValue: newIdMap[newPrimaryId] });
  }
  return updateEvents;
} */

function checkPrimary(elements) {
  if (elements[0]
    && (elements[0].primary != undefined)
    && (_.sum(elements.map(el => el.primary == true)) != 1)) {
    return Promise.reject(new InvalidRequestError('non-empty array field with primary property must have one and only one primary element'));
  }
}

/* async function isNewSocialProfile(name, platform) {
  const profileQueries = entityTypes.map(type => (
    modelsByType[type]
      .findOne({ 'socialProfiles': { $elemMatch: { name: name, type: platform } } })
  ));

  const resolvedQueries = await Promise.all(profileQueries);
  
  return resolvedQueries.every(q => q === null);
}; */

module.exports = {
  addPersona,
  addPersonaConnection,
  addFieldOrElement,
  deleteArrayElement,
  deletePersona,
  deleteField,
  getAllPersonas,
  getBatchInfoById,
  getPersona,
  getPersonaWeights,
  editField,
  //isNewSocialProfile,
  //publishNewEntity,
};
