
require("./GSS.js")
Compiler = GSS.Compiler = require("gss-compiler")

# Monkey patching compiling powers

GSS.compile = (rules) ->
  ast = {}
  if typeof rules is "string"
    try
      ast = Compiler.compile(rules)
    catch e
      console.warn "compiler error", e
      ast = {}
  # ruels are changed by reference!
  else if typeof rules is "object"
    ast = rules
  else
    throw new Error("Unrecognized GSS rule format. Should be string or AST")
  return ast

GSS.Engine::['compile'] = (source) ->
  @run GSS.compile source

GSS.Getter::['readAST:text/gss'] = (node) ->
  source = node.textContent.trim()
  if source.length is 0 then return {}
  #try
  ast = GSS.compile source
  #catch e
  #  console.error "Parsing compiled gss error", console.dir e
  return ast

