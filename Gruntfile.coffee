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
      noflo:
        files:
          './browser/gss-engine.min.js': ['./browser/gss-engine.js']

    # Automated recompilation and testing when developing
    watch:
      #build:
      #  files: ['spec/*.coffee', 'src/*.coffee']
      #  tasks: ['build']
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
        src: ['**/*.coffee']
        dest: 'lib'
        ext: '.js'      
      spec:
        options:
          bare: true
        expand: true
        cwd: 'spec'
        src: ['**.coffee']
        dest: 'spec'
        ext: '.js'

    # BDD tests on browser
    mocha_phantomjs:
      all: ['spec/runner.html']

  # Grunt plugins used for building
  @loadNpmTasks 'grunt-component'
  @loadNpmTasks 'grunt-component-build'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Grunt plugins used for testing
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-coffee'
  @loadNpmTasks 'grunt-mocha-phantomjs'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'build', ['component', 'coffee', 'uglify', 'jshint','component_build']
  @registerTask 'test', ['build',  'mocha_phantomjs']
  @registerTask 'default', ['build']
