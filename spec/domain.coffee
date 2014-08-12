assert = chai.assert
expect = chai.expect

describe 'Domain', ->
	describe 'single solving domain', ->
		it 'should find solutions', ->
			engine = new GSS.Engine()
			debugger
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
			engine = new GSS({
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
			engine = new GSS({
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
			engine = new GSS({
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
			engine = new GSS
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
			expect(engine.solve
				a: 666
			).to.eql
				a: 666
				result: 667

			console.error('A=null')
			expect(engine.solve
				a: null
			).to.eql
				a: -1
				result: 0

		it 'should use intrinsic values as known values', ->
			el = document.createElement('div')
			el.innerHTML = """
				<div id="box0" style="width: 50px"></div>
				<div id="box1" style="width: 50px"></div>
			"""
			window.engine = new GSS(el)
			engine.solve [
				['==',
					['get', 'a']
					['+',
						['get', ['$id', 'box0'], 'z']
						['get', ['$id', 'box1'], 'intrinsic-width']
					]
				]
			], (solution) ->
				expect(solution).to.eql
					"$a": "50"
					"$box0[z]": 0
					"$box1[width]": 50



		it 'should handle asynchronous solvers', (done) ->
			engine = new GSS true
			problem = [
				['=='
					['get', 'result']
					['+',
						['get', 'a'],
						1]
				]
			]

			solved = 
				engine.solve problem, (solution) ->
					expect(solution).to.eql 
						a: -1
						result: 0
					done()


			expect(solved).to.eql undefined

	describe 'variable graphs', ->
		it 'should unmerge multiple domains', ->
			window.engine = new GSS
			problem = [
				['==',
					['get', 'a']
					1
				]
				['==',
					['get', 'b']
					['get', 'c']
				]
			]
			expect(engine.solve(problem)).to.eql
				a: 1
				b: 0
				c: 0

			expect(engine.solve [
				['==', 
					['get', 'c'],
					['*', 
						2
						['get', 'a', null, 'my_tracker_path']
					]
				]
			]).to.eql
				b: 2
				c: 2

			expect(engine.solve [
				['remove', 'my_tracker_path']
			])


		it 'should merge multiple domains', ->
			window.engine = new GSS
			# Makes two separate graphs
			problem = [
				['=='
					['get', 'result']
					['+',
						['get', 'a'],
						1]
				]
				['<='
					['get', 'b'],
					4
				],
				['>='
					['get', 'b'],
					2
				],
			]
			expect(engine.solve(problem)).to.eql
				result: 0
				a: -1
				b: 4
			
			# Add to 1st graph
			expect(engine.solve [
				['>='
					['get', 'a']
					5
				]
			]).to.eql
				result: 6
				a: 5

			# Add to 2nd graph
			expect(engine.solve [
				['>='
					['get', 'c']
					['+'
						['get', 'b']
						6
					]
				]
			]).to.eql
				c: 10

			# Add to 2nd graph again
			expect(engine.solve [
				['=='
					['get', 'b']
					3
				]
			]).to.eql
				c: 9
				b: 3

			# merge two graphs
			expect(engine.solve [
				['<=', 
					['get', 'c'],
					['get', 'result']
				]
			]).to.eql
				a: 8
				c: 9
				result: 9
				b: 3


