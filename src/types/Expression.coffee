Expression = ->

Expression.fromExpression ->

Expression.fromPrimitive ->



['==', ['get', 'a'], ['+', ['get', 'b']]]
		^ Variable
								^ Variable
						^ Expression
	^ Constraint


Variable -> Expression
Variable, Expression ->
	Constraint
	