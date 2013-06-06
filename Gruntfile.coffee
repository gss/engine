module.exports = ->
  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    # Build the browser Component
    component:
      install:
        options:
          action: 'install'
    component_build:
      'gss-engine':
        output: './browser/'
        config: './component.json'
        scripts: true
        styles: false

    # JavaScript minification for the browser
    uglify:
      options:
        report: 'min'
      engine:
        files:
          './browser/gss-engine.min.js': ['./browser/gss-engine.js']
      worker:
        files:
          './browser/engine/worker.min.js': ['./browser/engine/worker.js']

    # Automated recompilation and testing when developing
    watch:
      build:
        files: ['spec/*.coffee', 'src/*.coffee']
        tasks: ['build']
      test:
        files: ['spec/*.coffee', 'src/*.coffee']
        tasks: ['test']

    # Syntax checking
    jshint:
      lib: ['lib/*.js']
      dom: ['lib/**/*.js']

    # CoffeeScript compilation
    coffee:
      src:
        options:
          bare: true
        expand: true
        cwd: 'src'
        src: ['**.coffee']
        dest: 'lib'
        ext: '.js'
      dom:
        options:
          bare: true
        expand: true
        cwd: 'src/dom'
        src: ['**.coffee']
        dest: 'lib/dom'
        ext: '.js'
      spec:
        options:
          bare: true
        expand: true
        cwd: 'spec'
        src: ['**.coffee']
        dest: 'spec'
        ext: '.js'

    # Worker process concatenation
    concat:
      worker:
        src: ['vendor/c.js', 'lib/Thread.js', 'lib/Worker.js']
        dest: 'worker.js'

    # BDD tests on browser
    mocha_phantomjs:
      all: ['spec/runner.html']

  # Grunt plugins used for building
  @loadNpmTasks 'grunt-component'
  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-component-build'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Grunt plugins used for testing
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-mocha-phantomjs'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'build', ['coffee', 'concat', 'component', 'component_build', 'uglify']
  @registerTask 'test', ['build',  'mocha_phantomjs']
  @registerTask 'default', ['build']
