
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

runRemotes = (url) ->
  req = new XMLHttpRequest
  req.onreadystatechange = ->
    return unless req.readyState is 4
    return unless req.status is 200
    engine = GSS document
    engine.compile req.responseText
  req.open 'GET', url, true
  req.send null

remoteGSS = document.querySelectorAll 'link[rel="stylesheet"][type="text/gss"]'
if remoteGSS
  runRemotes link.getAttribute('href') for link in remoteGSS