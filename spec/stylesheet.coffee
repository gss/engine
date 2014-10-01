
expect = chai.expect
assert = chai.assert


describe 'Stylesheet', ->
	engine = container = null
	beforeEach ->
		container = document.createElement('div')
		document.body.appendChild(container)
		engine = new GSS(container)
	afterEach ->
		container.parentNode.removeChild(container)
		engine.destroy()
		container = engine = null

	describe 'with static rules', ->
		describe 'in top scope', ->
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
							for rule in engine.stylesheets.sheets.$gss.sheet.cssRules
								rule.cssText
						).to.eql [".box { width: 1px; }"]
						done()

			describe 'with custom selectors', ->
				it 'should include generaeted rules', (done) ->
					container.innerHTML = """
						<style type="text/gss" id="gss">
							#box2 !+ .box {
								width: 1px;
							}
						</style>
						<div class="box" id="box1"></div>
						<div class="box" id="box2"></div>
					"""
					engine.then ->
						expect(
							for rule in engine.stylesheets.sheets.$gss.sheet.cssRules
								rule.cssText
						).to.eql ['[matches~="#box2!+.box"] { width: 1px; }']
						done()


			describe 'with self-referential selectors', ->
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
							for rule in engine.stylesheets.sheets.$gss2.sheet.cssRules
								rule.cssText
						).to.eql [".box { width: 1px; }"]
						done()


		describe 'nested', ->
			describe 'into a simple rule', ->
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
								for rule in engine.stylesheets.sheets.$gss.sheet.cssRules
									rule.cssText
							).to.eql [".outer .box { width: 1px; }"]
							expect(engine.$id('box1').getAttribute('matches')).to.eql ' .outer' + GSS.DESCEND + ' .box'
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
								for rule in engine.stylesheets.sheets.$gss.sheet.cssRules
									rule.cssText
							).to.eql ['[matches~=".outer #box2!+.box"] { width: 1px; }']
							done()


				describe 'with self-referential selectors', ->
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
								for rule in engine.stylesheets.sheets.$gss2.sheet.cssRules
									rule.cssText
							).to.eql [".box { width: 1px; }"]
							done()
