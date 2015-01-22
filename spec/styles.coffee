
expect = chai.expect
assert = chai.assert


describe 'Styles', ->
  doc = engine = null
  before ->
    engine ||= new GSS(document.createElement('div'))
    engine.compile()
    doc = {}
    for property, value of engine.output.properties
      do (property, value) ->
        doc[property] = ->
          value.apply(engine.output, arguments)
        doc[property].initial = value.initial
        
  describe 'simple properties', ->

    it 'numeric property', ->
      expect(doc['z-index'](10)).to.eql(10)
      expect(doc['z-index'](10.5)).to.eql(undefined)
      expect(doc['z-index']('ff')).to.eql(undefined)

    it 'length & percentage', ->
      expect(doc['font-size'](10)).to.eql(10)
      expect(doc['font-size'](['em', 10])).to.eql(['em', 10])
      expect(doc['font-size'](['%', 10])).to.eql(['%', 10])
      expect(doc['font-size'](['s', 10])).to.eql(undefined)

    it 'keywords', ->
      expect(doc['float']('none')).to.eql('none')
      expect(doc['float']('left')).to.eql('left')
      expect(doc['float']('reft')).to.eql(undefined)

  describe 'shorthand with no specific order of properties', ->
    it 'should expand properties', ->
      expect(doc['background'](['rgb',1,1,1])).to.eql new doc['background'].initial
        'background-color': ['rgb',1,1,1]
      expect(doc['background']('no-repeat', ['hsla',3,2,1,0])).to.eql new doc['background'].initial
        'background-repeat': 'no-repeat'
        'background-color': ['hsla',3,2,1,0]
      expect(doc['background']('no-repeat', ['hsla',3,2,1,0], 'no-repeat')).to.eql undefined
      expect(doc['background']('no-repeat', ['hsla',3,2,1,0], 2, 'right')).to.eql new doc['background'].initial
        'background-repeat': 'no-repeat'
        'background-color': ['hsla',3,2,1,0]
        'background-position-y': 2
        'background-position-x': 'right'

      expect(doc['background']('top', 'right', 'padding-box', 'border-box',['linear-gradient', ['to', 'top', 'right']])).to.eql  new doc['background'].initial
        'background-position-y': 'top'
        'background-position-x': 'right'
        'background-origin': 'padding-box'
        'background-clip': 'border-box'
        'background-image': ['linear-gradient', ['to', 'top', 'right']]

  describe 'unordered shorthand with multiple values', ->
    it 'should expand each value', ->

      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent')).to.eql new doc['background'].initial
        0: new doc['background'].initial
          'background-repeat': 'no-repeat'
        1: new doc['background'].initial
          'background-repeat': 'repeat'
        'background-color': 'transparent'
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format()).to.
        eql 'no-repeat, repeat transparent'
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format(
        "background-image-2": ['url', 'abc']
      )).to.eql 'no-repeat, url(abc) repeat transparent'
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format(
        "background-repeat-2": "repeat-y"
      )).to.eql 'no-repeat, repeat-y transparent'
      expect(doc['background'](['no-repeat'], ['repeat'], 'transparent').format(
        "background-position-y-1": "top"
      )).to.eql 'top no-repeat, repeat transparent'

  describe 'ordered shorthand with multiple values', ->
    it 'should do things', ->
      expect(doc['box-shadow']([1,1,'transparent'], [2,2,['rgba', 1,1,1]])).to.eql new doc['box-shadow'].initial
        0: new doc['box-shadow'].initial
          'box-shadow-offset-x': 1
          'box-shadow-offset-y': 1
          'box-shadow-color': 'transparent'
        1: new doc['box-shadow'].initial 
          'box-shadow-offset-x': 2
          'box-shadow-offset-y': 2
          'box-shadow-color': ['rgba', 1,1,1]
      
      expect(doc['box-shadow']([1,1,'transparent'], [2,2,['rgba', 1,1,1]]).format()).to.
        eql '1px 1px transparent, 2px 2px rgba(1,1,1)'
      
      expect(doc['box-shadow']([1,1,'transparent'], [2,2,['rgba', 1,1,1]]).format(
        'box-shadow-offset-x-1': -1
        'box-shadow-offset-y-2': -2
      )).to.eql '-1px 1px transparent, 2px -2px rgba(1,1,1)'

      expect(doc['box-shadow']([1,1,'transparent'], [2,2,['rgba', 1,1,1]]).format(
        'box-shadow-blur-1': ['em', 1]
        'box-shadow-spread-2': ['cm', 2] # adds default blur value
      )).to.eql '1px 1px 1em transparent, 2px 2px 0 2cm rgba(1,1,1)'

  describe 'ordered shorthands', ->
    it 'should validate and expand value', ->
      expect(doc['border-top'](1, 'solid', 'transparent')).to.eql new doc['border-top'].initial
        'border-top-width': 1
        'border-top-style': 'solid'
        'border-top-color': 'transparent'
      expect(doc['border-left'](1, 'solid', 'tranceparent')).to.eql undefined
      expect(doc['border-left'](1, 'zolid', ['rgb', 1,1,1])).to.eql undefined
      expect(doc['border-left'](['rgb', 1,1,1], ['em', 2])).to.eql new doc['border-left'].initial
        'border-left-color': ['rgb', 1,1,1]
        'border-left-width': ['em', 2]

  describe 'dimensional shorthands', ->
    it 'should validate, pad and expand values', ->
      expect(doc['margin'](1)).to.eql new doc['margin'].initial
        'margin-top': 1,
        'margin-right': 1
        'margin-bottom': 1
        'margin-left': 1
      expect(doc['padding'](1, ['cm', 2])).to.eql new doc['padding'].initial
        'padding-top': 1,
        'padding-right': ['cm', 2]
        'padding-bottom': 1
        'padding-left': ['cm', 2]
      expect(doc['border-width'](1, ['cm', 2], ['vh', 3])).to.eql new doc['border-width'].initial
        'border-top-width': 1,
        'border-right-width': ['cm', 2]
        'border-bottom-width': ['vh', 3]
        'border-left-width': ['cm', 2]
      expect(doc['border-style']('solid', 'dotted', 'double', 'ridge')).to.eql new doc['border-style'].initial
        'border-top-style': 'solid',
        'border-right-style': 'dotted'
        'border-bottom-style': 'double'
        'border-left-style': 'ridge'
  describe 'corner shorthands', ->
    it 'should validate, pad and expand values', ->
      expect(doc['border-radius'](1)).to.eql new doc['border-radius'].initial
        "border-top-left-radius": 1,
        "border-top-right-radius": 1
        "border-bottom-left-radius": 1
        "border-bottom-right-radius": 1
      expect(doc['border-radius'](1, 2)).to.eql new doc['border-radius'].initial
        "border-top-left-radius": 1,
        "border-top-right-radius": 2
        "border-bottom-left-radius": 1
        "border-bottom-right-radius": 2
      
  xdescribe 'transformations', ->
    it 'should generate matrix', ->
      engine.solve [
        ['rotateX', ['deg', 10]]
        ['scaleZ', 2]
        ['translateY', -2]
      ]
      expect(doc['transform']()).to.eql 123
