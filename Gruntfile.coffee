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
          './browser/gss-engine/worker/gss-solver.min.js': ['./browser/gss-engine/worker/gss-solver.js']

    # Automated recompilation and testing when developing
    watch:
      build:
        files: ['spec/*.coffee', 'src/*.coffee', 'src/**/*.coffee']
        tasks: ['test']
      test:
        files: ['spec/*.coffee', 'src/*.coffee']
        tasks: ['test']

    # Syntax checking
    coffeelint:
      src: ['src/*.coffee', 'src/**/*.coffee']
      spec:
        files:
          src: ['spec/*.coffee']
        options:
          max_line_length:
            level: 'ignore'

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
        dest: 'worker/gss-solver.js'

    # BDD tests on browser
    mocha_phantomjs:
      all: ['spec/runner.html']

    # Cross-browser testing
    connect:
      server:
        options:
          base: ''
          port: 9999

    'saucelabs-mocha':
      all:
        options:
          urls: ['http://127.0.0.1:9999/spec/runner.html']
          browsers: [
            browserName: 'chrome'
          ,
            browserName: 'firefox'
          ,
            browserName: 'safari'
          ,
            browserName: 'ipad'
          ,
            browserName: 'android'
          ,
            browserName: 'internet explorer'
            platform: 'WIN8'
            version: '10'
          ]
          build: process.env.TRAVIS_JOB_ID
          testname: 'GSS engine browser tests'
          tunnelTimeout: 5
          concurrency: 3
          detailedError: true

  # Grunt plugins used for building
  @loadNpmTasks 'grunt-component'
  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-component-build'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Grunt plugins used for testing
  @loadNpmTasks 'grunt-coffeelint'
  @loadNpmTasks 'grunt-mocha-phantomjs'
  @loadNpmTasks 'grunt-contrib-watch'

  # Cross-browser testing in the cloud
  @loadNpmTasks 'grunt-contrib-connect'
  @loadNpmTasks 'grunt-saucelabs'

  @registerTask 'build', ['coffee', 'concat', 'component', 'component_build', 'uglify']
  @registerTask 'test', ['coffeelint', 'build',  'mocha_phantomjs']
  @registerTask 'crossbrowser', ['coffeelint', 'build', 'mocha_phantomjs', 'connect', 'saucelabs-mocha']
  @registerTask 'default', ['build']
