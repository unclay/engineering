'use strict';
var gulp = require('gulp');

require('./tool/help')(gulp);
require('./tool/engineering')(gulp);


gulp.task('default', function(){
	gulp.start('help');
});

