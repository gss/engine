assert = chai.assert
expect = chai.expect

describe 'Domain', ->
	describe 'single solving domain', ->
		it 'should find solutions', ->
			window.engine = new GSS.Engine()
			expect(engine.solve [
				['==',
					['get', 'result']
					['+',
						['get', 'a']
						1
					]
				]
			]).to.eql 
				result: 0
				a: -1

	describe 'solving and assumed domains together', ->
		it 'should calculate simplified expression', ->
			window.engine = new GSS({
				a: 666
			})

			expect(engine.solve [
				['==',
					['get', 'result']
					['+',
						['get', 'a']
						1
					]
				]
			]).to.eql 
				result: 667


		it 'should simplify partially', ->
			window.engine = new GSS({
				a: 555
			})

			expect(engine.solve [
				['=='
					['get', 'b'],
					10
				],
				['==',
					['get', 'result']
					['+',
						['*'
							2,
							['get', 'a']]
						['get', 'b']
					]
				]
			]).to.eql 
				result: 555 * 2 + 10
				b: 10

			expect(engine.solve
				a: -555
			).to.eql
				result: -1100


		it 'should simplify multiple variables partially', ->
			window.engine = new GSS({
				a: 555,
				A: 2
			})
			expect(engine.solve [
				['=='
					['get', 'b'],
					10
				],
				['==',
					['get', 'result']
					['+',
						['*'
							['get', 'A'],
							['get', 'a']]
						['get', 'b']
					]
				]
			]).to.eql 
				result: 555 * 2 + 10
				b: 10

			console.info('a=-555, was 555')
			
			expect(engine.solve
				a: -555
			).to.eql
				result: -1100

			console.info('A=1, was 2')

			expect(engine.solve
				A: 1
			).to.eql
				result: -545

		it 'should change variable domain after the fact', ->
			window.engine = new GSS
			expect(engine.solve [
				['=='
					['get', 'result']
					['+',
						['get', 'a'],
						1]
				]
			]).to.eql
				result: 0
				a: -1

			console.error('A=666')
			expect(window.engine.solve
				a: 666
			).to.eql
				a: 666
				result: 667

			console.error('A=null')
			expect(window.engine.solve
				a: null
			).to.eql
				a: -1
				result: 0

		it 'should handle asynchronous solvers', (done) ->
			window.engine = new GSS true
			engine.once 'solved', (solution) ->
				expect(solution).to.eql 
					a: -1
					result: 0
				done()
			expect(engine.solve [
				['=='
					['get', 'result']
					['+',
						['get', 'a'],
						1]
				]
			]).to.eql undefined


