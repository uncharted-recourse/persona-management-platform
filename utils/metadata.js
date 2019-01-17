// copied from hermes

const personaReasons = [
  {
    display: 'Solicitation for Financial Assistance',
    value: 'Solicitation for Financial Assistance',
  },
  {
    display: 'Excessive Letter Writing - Postal',
    value: 'Excessive Letter Writing - Postal',
  },
  {
    display: 'Excessive Letter Writing - Email',
    value: 'Excessive Letter Writing - Email',
  },
  {
    display: 'Social Media Commentary',
    value: 'Social Media Commentary',
  },
  {
    display: 'Direct Phsyical Approach',
    value: 'Direct Phsyical Approach',
  },
  {
    display: 'Direct Physical Approach (Attempted)',
    value: 'Direct Physical Approach (Attempted)',
  },
  {
    display: 'Fixation / Unhealthy Interest in Client / Executives',
    value: 'Fixation / Unhealthy Interest in Client / Executives',
  },
  {
    display: 'Religious Ideologies',
    value: 'Religious Ideologies',
  },
  {
    display: 'Violent Threat (Direct or Indirect)',
    value: 'Violent Threat (Direct or Indirect)',
  },
  {
    display: 'Other',
    value: 'Other',
  },
];

/* const placeReasons = [
  {
    display: 'Principal Place of Employment',
    value: 'Principal Place of Employment',
  },
  {
    display: 'Frequented Venue (Commercial Location)',
    value: 'Frequented Venue (Commercial Location)',
  },
  {
    display: 'Frequented Venue (Political Affiliations)',
    value: 'Frequented Venue (Political Affiliations)',
  },
  {
    display: 'Frequented Venue (Philanthropic Associations)',
    value: 'Frequented Venue (Philanthropic Associations)',
  },
  {
    display: 'Primary Healthcare Provider',
    value: 'Primary Healthcare Provider',
  },
  {
    display: 'Religious Institution',
    value: 'Religious Institution',
  },
  {
    display: 'Affiliated Educational Institution',
    value: 'Affiliated Educational Institution',
  },
  {
    display: 'Social Media Commentary',
    value: 'Social Media Commentary',
  },
  {
    display: 'Known Vendor or Service Provider',
    value: 'Known Vendor or Service Provider',
  },
  {
    display: 'Other',
    value: 'Other',
  },
];

const eventReasons = [
  {
    display: 'Principal / Family birthday',
    value: 'Principal / Family birthday',
  },
  {
    display: 'Anniversary',
    value: 'Anniversary',
  },
  {
    display: 'Primary Business Affiliation',
    value: 'Primary Business Affiliation',
  },
  {
    display: 'Industry / Networking',
    value: 'Industry / Networking',
  },
  {
    display: 'Political Affiliation',
    value: 'Political Affiliation',
  },
  {
    display: 'Philanthropic Event',
    value: 'Philanthropic Event',
  },
  {
    display: 'Social Media Commentary',
    value: 'Social Media Commentary',
  },
  {
    display: 'Other',
    value: 'Other',
  },
]; */

const reasonsForInclusion = {
  persona: personaReasons,
  //place: placeReasons,
  //event: eventReasons
};

const personaConnectionTypes = {
  persona: [
    {
      display: 'Former Colleague',
      value: 'Former Colleague',
    },
    {
      display: 'Attended Same University',
      value: 'Attended Same University',
    },
    {
      display: 'Lived in Same City',
      value: 'Lived in Same City',
    },
  ],
  /* event: [
    {
      display: 'Attended',
      value: 'Attended',
    },
    {
      display: 'Mentioned',
      value: 'Mentioned',
    },
    {
      display: 'Organized',
      value: 'Organized',
    },
  ],
  place: [
    {
      display: 'Lived At',
      value: 'Lived At',
    },
    {
      display: 'Worked At',
      value: 'Worked At',
    },
    {
      display: 'Seen At',
      value: 'Seen At',
    },
  ] */
};

/* const placeConnectionTypes = {
  person: [
    {
      display: 'Occupied By',
      value: 'Occupied By',
    },
    {
      display: 'Frequented By',
      value: 'Frequented By',
    },
    {
      display: 'Mentioned By',
      value: 'Mentioned By',
    },
  ],
  place: [
    {
      display: 'Located Near',
      value: 'Located Near',
    },
  ],
  event: [
    {
      display: 'Hosted',
      value: 'Hosted',
    },
    {
      display: 'Sponsored',
      value: 'Sponsored',
    },
    {
      display: 'Organized',
      value: 'Organized',
    },
  ]
};

const eventConnectionTypes = {
  person: [
    {
      display: 'Attended By',
      value: 'Attended By',
    },
    {
      display: 'Mentioned By',
      value: 'Mentioned By',
    },
    {
      display: 'Organized By',
      value: 'Organized By',
    },
  ],
  place: [
    {
      display: 'Hosted By',
      value: 'Hosted By',
    },
    {
      display: 'Sponsored By',
      value: 'Sponsored By',
    },
    {
      display: 'Organized By',
      value: 'Organized By',
    },
  ],
  event: [
    {
      display: 'Same Time As',
      value: 'Same Time As',
    },
  ]
}; */

const connectionTypes = {
  persona: personaConnectionTypes,
  //place: placeConnectionTypes,
  //event: eventConnectionTypes,
};

const socialProfileTypes = [
  { display: 'Twitter', value: 'twitter' },
  { display: 'Facebook', value: 'facebook' },
  { display: 'Reddit', value: 'reddit' },
  { display: 'Instagram', value: 'instagram' },
  { display: 'Tumblr', value: 'tumblr' },
  { display: 'Other', value: 'other' },
];

/* const userRoles = [
  { display: 'Admin', value: 'admin' },
  { display: 'Analyst', value: 'analyst' }
]; */

module.exports = {
  connectionTypes,
  reasonsForInclusion,
  socialProfileTypes,
  // userRoles,
};