const mongoose = require('mongoose');
const _ = require('lodash');
const {
  // Address,
  Name,
  SocialProfile,
  Weights,
  /* Note,
  Email,
  PhoneNumber,
  Connection, */
} = require('./component-models');
const { setType, setName } = require('./plugins');

// add person-specific properties to base config to create the schema:
const personaSchema = new mongoose.Schema({
  names: [Name],
  socialProfiles: [SocialProfile],
  //   addresses: [Address],
  //   notes: [Note],
  //   phones: [PhoneNumber],
  //   emails: [Email],
  weights: [Weights],
  // race: { type: String, default: '' },
  // gender: { type: String, enum: ['', 'Female', 'Male', 'Other'], default: '' },
  //   threat: { type: Number, min: -1, max: 100, default: 0 },
  //   autoCreated: { type: Boolean, default: false, index: true },
  //   reasonForInclusion: { type: String, trim: true, default: '' },
  //   connections: [Connection], // TODO remove / replace with id from  connection collection
}, {
  strict: false, // mongoose won't enforce the schema,
  timestamps: true //adds createdAt and updatedAt timestamps populates/updates them for you
});

personaSchema.plugin(setType, { type: 'persona' });
personaSchema.plugin(setName);

 const connectionSchema = new mongoose.Schema({
   fromEntityId: String,
   toEntityId: String,
 }, {
   strict: false,
   timestamps: true
 });

 connectionSchema.methods.sanitize = function () {
   return _.pick(this, ['fromEntityId', 'toEntityId']);
 };

module.exports = {
   connectionSchema,
   personaSchema,
 };
