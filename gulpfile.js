'use strict';
var gulp = require('gulp');

require('./tools/help')(gulp);
require('./tools/engineering')(gulp);


gulp.task('default', function(){
	gulp.start('help');
});

