var Condition, Constant, Constraint, Iterator;

Constraint = [
  [
    {
      left: ['Expression'],
      right: ['Expression']
    }, [
      {
        strength: ['String'],
        weight: ['Number']
      }
    ]
  ]
];

Constant = [
  [
    {
      left: ['Variable'],
      right: ['Expression']
    }
  ]
];

Iterator = [
  [
    {
      collection: ['Collection'],
      body: ['Array']
    }
  ]
];

Condition = [
  {
    "if": ['Expression'],
    then: ['Array']
  }, [
    {
      "else": ['Array']
    }
  ]
];
