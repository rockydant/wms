'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    yeoman: {
      app: 'app',
      dist: 'dist'
    },
    watch: {
      js: {
        files: ['app/scripts/{,*/}*.js', 'app/controllers/{,*/}*.js', 'app/services/{,*/}*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
      styles: {
        files: ['app/styles/{,*/}*.css'],
        tasks: ['newer:copy:styles', 'autoprefixer']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'app/{,*/}*.html',
          'app/views/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          'app/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    connect: {
      options: {
        port: 4200,
        hostname: '0.0.0.0',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            const serveStatic = require('serve-static');
            const path = require('path');
            const fs = require('fs');
            return [
              // Serve .tmp directory first (for compiled CSS, etc.)
              serveStatic('.tmp'),
              // Serve bower_components
              serveStatic('./bower_components', { mount: '/bower_components' }),
              // Serve app directory (this will serve all static files including .js, .css, etc.)
              serveStatic('app'),
              // Fallback middleware - only for routes without file extensions (SPA routing)
              function(req, res, next) {
                // Skip API calls - they should 404 if not handled by backend
                if (req.url.indexOf('/api') === 0) {
                  return next();
                }
                // Check if this is a file request (has extension)
                const urlPath = req.url.split('?')[0]; // Remove query string
                const ext = path.extname(urlPath);
                
                // If it has an extension, let serveStatic handle it (or 404)
                if (ext && ext !== '') {
                  return next();
                }
                
                // For routes without extensions (like /login, /dashboard), serve index.html
                const indexPath = path.join(__dirname, 'app/index.html');
                if (fs.existsSync(indexPath)) {
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  res.statusCode = 200;
                  res.end(fs.readFileSync(indexPath));
                  return;
                }
                
                // If index.html doesn't exist, 404
                next();
              }
            ];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            const serveStatic = require('serve-static');
            return [
              serveStatic('.tmp'),
              serveStatic('test'),
              serveStatic('./bower_components', { mount: '/bower_components' }),
              serveStatic('app')
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: 'dist'
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          'app/scripts/{,*/}*.js',
          'app/controllers/{,*/}*.js',
          'app/services/{,*/}*.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git{,*/}*'
          ]
        }]
      },
      server: '.tmp'
    },

    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      server: {
        options: {
          map: true,
        },
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },

    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: '*.js',
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    concat: {
      dist: {
        src: [
          'app/**/*.js',
          '!app/**/*.spec.js'
        ],
        dest: 'dist/scripts/app.js'
      }
    },

    uglify: {
      dist: {
        files: {
          'dist/scripts/app.js': [
            'dist/scripts/app.js'
          ]
        }
      }
    },

    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'dist',
          src: ['styles/*.css', '!styles/*.min.css'],
          dest: 'dist',
          ext: '.min.css'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: 'dist',
          src: ['*.html', 'views/{,*/}*.html'],
          dest: 'dist'
        }]
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'app',
          dest: 'dist',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'views/**/*.html',
            'images/**/*.{webp,png,jpg,jpeg,svg}',
            'fonts/**/*.*'
          ]
        }]
      },
      styles: {
        expand: true,
        cwd: 'app/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    }
  });

  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'autoprefixer:server',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'autoprefixer',
    'karma'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'autoprefixer:dist',
    'concat',
    'ngAnnotate',
    'copy:dist',
    'cssmin',
    'uglify',
    'htmlmin'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
