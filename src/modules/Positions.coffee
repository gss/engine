### Output: DOM element styles
  
Applies style changes in bulk, separates reflows & positions.
Revalidates intrinsic measurements, optionally schedules 
another solver pass

###
class Positions
  constructor: (@engine) -> 

  yield: (id, property, value, positioning) ->
    # parse $id[property] as [id, property]
    unless id?
      path = property
      last = path.lastIndexOf('[')
      return if last == -1
      property = path.substring(last + 1, path.length - 1)
      id = path.substring(0, last)

    return unless id.charAt(0) != ':'
    unless element = @engine.identity[id]
      return if id.indexOf('"') > -1
      return unless element = document.getElementById(id.substring(1))
    
    if positioning && (property == 'x' || property == 'y')
      (positioning[id] ||= {})[property] = value
    else
      @engine.intrinsic.restyle(element, property, value)

  solve: (data, node) ->
    node ||= @reflown || @engine.scope
    @engine.mutations?.disconnect(true)

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    if data
      for path, value of data
        unless value == undefined
          @yield null, path, value, positioning

    # Adjust positioning styles to respect element offsets 
    @engine.intrinsic.each(node, @placehold, null, null, null, positioning, !!data)

    # Set new positions in bulk (Reflow)
    for id, styles of positioning
      for prop, value of styles
        @yield id, prop, value

    @engine.mutations?.connect(true)
    return data

  # Calculate offsets according to new values (but dont set anything)
  placehold: (element, x, y, positioning, full) ->
    offsets = undefined
    if uid = element._gss_id
      # Adjust newly set positions to respect parent offsets
      styles = positioning?[uid]
      if values = @engine.values
        if styles?.x == undefined
          if (left = values[uid + '[x]'])?
            (styles ||= (positioning[uid] ||= {})).x = left
        if styles?.y == undefined
          if (top = values[uid + '[y]'])?
            (styles ||= (positioning[uid] ||= {})).y = top

      if styles
        for property, value of styles
          unless value == null
            switch property
              when "x"
                styles.x = value - x
                (offsets ||= {}).x = value - x
              when "y"
                styles.y = value - y
                (offsets ||= {}).y = value - y

      # Let other measurements hook up into this batch
      # @engine.intrinsic.update(element, x, y, full)


    return offsets

module.exports = Positions