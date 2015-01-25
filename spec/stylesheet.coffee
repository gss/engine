
expect = chai.expect
assert = chai.assert

IE10 = !!window.ActiveXObject || document.body.style.msTouchAction?

describe 'Stylesheet', ->
  engine = container = null
  beforeEach ->
    container = document.createElement('div')
    document.body.appendChild(container)
    window.$engine = engine = new GSS(container)
  afterEach ->
    container.parentNode.removeChild(container)
    engine.destroy()
    container = engine = null

  normalizeSelector = (string) ->
    string.replace /([^ ]+)(\[[^\]]+\])/g, (m,a,b) ->
      return b + a
    .replace(/\='/g, '="').replace(/'\]/g, '"]')
    .replace /(\.[a-zA-Z0-9-]+)(\#[a-zA-Z0-9-]+)/g, (m,a,b) ->
      return b + a

  describe 'with static rules', ->
    describe 'in top scope', ->
      describe 'with custom selectors', ->
        it 'should include generaeted rules', (done) ->
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['[matches~="#box2!+.box"] { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '#box2!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            done()
          container.innerHTML = """
            <style type="text/gss" id="gss">
              #box2 !+ .box {
                width: 1px;
              }
            </style>
            <div class="box" id="box1"></div>
            <div class="box" id="box2"></div>
          """
            
      describe 'with simple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .box {
                width: 1px;
              }
            </style>
            <div class="box" id="box1"></div>
            <div class="box" id="box2"></div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".box { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()




      xdescribe 'with self-referential selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .box {
                width: 1px;
              }
            </style>
            <div class="box" id="box1"></div>
            <div class="box" id="box2"></div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".box { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '#box2!+.box'
            done()


      describe 'with multiple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .box, .zox {
                width: 1px;
              }
            </style>
            <div class="box" id="box1"></div>
            <div class="box" id="box2"></div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".box, .zox { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.box,.zox'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.box,.zox'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()

      describe 'with mixed selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .box, &.zox, !+ .box{
                width: 1px;
              }
            </style>
            <div class="box" id="box1"></div>
            <div class="box" id="box2"></div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['.box, .zox, [matches~=".box,&.zox,!+.box"] { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '.box,&.zox,!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            done()



    describe 'in a simple rule', ->
      describe 'with simple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .outer {
                .box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".outer .box { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()

      describe 'with custom selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .outer {
                #box2 !+ .box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['[matches~=".outer' + GSS.Engine::Command::DESCEND + '#box2!+.box"] { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '#box2!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 
            
            done()


      describe 'with self-referential selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              #box1 {
                &.box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ["#box1.box { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '#box1 #box1' + GSS.Engine::Command::DESCEND + '&.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql null
            expect(engine.id('box2').offsetWidth).to.not.eql 1
            
            done()



      describe 'with multiple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .outer {
                .box, .zox {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".outer .box, .outer .zox { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '.box,.zox'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '.box,.zox'
            expect(engine.id('box2').offsetWidth).to.eql 1
            
            done()

      describe 'with mixed selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .outer {
                .box, &.zox, !+ .box{
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [
              if IE10
                '.outer .box, .zox.outer, [matches~=".outer' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box"] { width: 1px; }'
              else
                '.outer .box, .outer.zox, [matches~=".outer' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box"] { width: 1px; }'
              ]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()



    describe 'in a comma separated rule', ->
      describe 'with simple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .outer, .zouter {
                .box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".outer .box, .zouter .box { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,.zouter' + GSS.Engine::Command::DESCEND + '.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer,.zouter' + GSS.Engine::Command::DESCEND + '.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()

      describe 'with custom selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .outer, .zouter {
                #box2 !+ .box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['[matches~=".outer,.zouter' + GSS.Engine::Command::DESCEND + '#box2!+.box"] { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,.zouter' + GSS.Engine::Command::DESCEND + '#box2!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql null
            expect(engine.id('box2').offsetWidth).to.not.eql 1
            done()


      describe 'with self-referential selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              #box1, .outer {
                &.box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [
              if IE10
                "#box1.box, .box.outer { width: 1px; }"
              else
                "#box1.box, .outer.box { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '#box1,.outer #box1,.outer' + GSS.Engine::Command::DESCEND + '&.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql null
            expect(engine.id('box2').offsetWidth).to.not.eql 1
            done()



      describe 'with multiple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .outer, .zouter {
                .box, .zox {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [".outer .box, .zouter .box, .outer .zox, .zouter .zox { width: 1px; }"]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,.zouter'+ GSS.Engine::Command::DESCEND + '.box,.zox'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer,.zouter'+ GSS.Engine::Command::DESCEND + '.box,.zox'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()

      describe 'with mixed selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .outer, .zouter {
                .box, &.zox, !+ .box{
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [
              if IE10
                '.outer .box, .zouter .box, .zox.outer, .zox.zouter, [matches~=".outer,.zouter' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box"] { width: 1px; }'
              else
                '.outer .box, .zouter .box, .outer.zox, .zouter.zox, [matches~=".outer,.zouter' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box"] { width: 1px; }'
            ]

            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,.zouter' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer,.zouter' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()

    describe 'in a rule with mixed selectors', ->
      describe 'with simple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .outer, div !+ div {
                .box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['.outer .box, [matches~=".outer,div!+div"] .box { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,div!+div .outer,div!+div' + GSS.Engine::Command::DESCEND + '.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer,div!+div' + GSS.Engine::Command::DESCEND + '.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            
            done()

      describe 'with custom selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss">
              .outer, div !+ div {
                #box2 !+ .box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['[matches~=".outer,div!+div' + GSS.Engine::Command::DESCEND + '#box2!+.box"] { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,div!+div .outer,div!+div' + GSS.Engine::Command::DESCEND + '#box2!+.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql null
            expect(engine.id('box2').offsetWidth).to.not.eql 1
            done()


      describe 'with self-referential selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              #box2, div !+ div {
                &.box {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector(rule.cssText)
            ).to.eql ['#box2.box, [matches~="#box2,div!+div"].box { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '#box2,div!+div #box2,div!+div' + GSS.Engine::Command::DESCEND + '&.box'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '#box2,div!+div #box2,div!+div' + GSS.Engine::Command::DESCEND + '&.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            done()



      describe 'with multiple selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .outer, div !+ div {
                .box, .zox {
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql ['.outer .box, [matches~=".outer,div!+div"] .box, .outer .zox, [matches~=".outer,div!+div"] .zox { width: 1px; }']
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,div!+div .outer,div!+div' + GSS.Engine::Command::DESCEND + '.box,.zox'
            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer,div!+div' + GSS.Engine::Command::DESCEND + '.box,.zox'
            expect(engine.id('box2').offsetWidth).to.eql 1
            
            done()

      describe 'with mixed selectors', ->
        it 'should include generaeted rules', (done) ->
          container.innerHTML = """
            <style type="text/gss" id="gss2">
              .outer, div !+ div {
                .box, &.zox, !+ .box{
                  width: 1px;
                }
              }
            </style>
            <div class="outer">
              <div class="box" id="box1"></div>
              <div class="box" id="box2"></div>
            </div>
          """
          engine.then ->
            expect(
              for rule in engine.stylesheets[0].sheet.cssRules
                normalizeSelector rule.cssText
            ).to.eql [
              if IE10
                '.outer .box, [matches~=".outer,div!+div"] .box, .zox.outer, [matches~=".outer,div!+div"].zox, [matches~=".outer,div!+div' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box"] { width: 1px; }'
              else
                '.outer .box, [matches~=".outer,div!+div"] .box, .outer.zox, [matches~=".outer,div!+div"].zox, [matches~=".outer,div!+div' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box"] { width: 1px; }'
              ]
            expect(engine.id('box1').getAttribute('matches')).to.eql '.outer,div!+div .outer,div!+div' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box'

            expect(engine.id('box1').offsetWidth).to.eql 1
            expect(engine.id('box2').getAttribute('matches')).to.eql '.outer,div!+div' + GSS.Engine::Command::DESCEND + '.box,&.zox,!+.box'
            expect(engine.id('box2').offsetWidth).to.eql 1
            
            done()

