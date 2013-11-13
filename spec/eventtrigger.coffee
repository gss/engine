describe "EventTrigger", ->
  it "on & off", ->
    e = new GSS.EventTrigger()
    count = 0
    listener = ->
      count++
    e.on "fire", listener
    e.trigger "fire"
    e.trigger "fire"
    e.off "fire", listener
    e.trigger "fire"
    e.trigger "fire"
    chai.assert count is 2, "should have listend 2, not: #{count}"
  
  it "on & offAll(eventType)", ->
    e = new GSS.EventTrigger()
    count = 0
    listener = ->
      count++
    e.on "fire", listener
    e.trigger "fire"
    e.trigger "fire"
    e.offAll "fire"
    e.trigger "fire"
    e.trigger "fire"
    chai.assert count is 2, "should have listend 2, not: #{count}"
  
  it "on & offAll(listener)", ->
    e = new GSS.EventTrigger()
    count = 0
    listener = ->
      count++
    e.on "fire", listener
    e.on "water", listener
    e.trigger "fire"
    e.trigger "water"
    e.offAll listener
    e.trigger "fire"
    e.trigger "water"
    e.trigger "fire"
    e.trigger "water"
    chai.assert count is 2, "should have listend 2, not: #{count}"
  
  it "on & offAll()", ->
    e = new GSS.EventTrigger()
    count = 0
    listener = ->
      count++
    e.on "fire", listener
    e.on "water", listener
    e.trigger "fire"
    e.trigger "water"
    e.offAll()
    e.trigger "fire"
    e.trigger "water"
    chai.assert count is 2, "should have listend 2, not: #{count}"
  
  it "once", ->
    e = new GSS.EventTrigger()
    count = 0
    listener = ->
      count++
    e.once "fire", listener
    e.trigger "fire"
    e.trigger "fire"
    e.trigger "fire"
    e.trigger "fire"
    chai.assert count is 1, "should have listend 1, not: #{count}"
  