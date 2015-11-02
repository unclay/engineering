'use strict';

var path = require('path');
var fs = require('fs');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var request = require('superagent');

// 变量
var SOURCE_SEEDIT_COM = 'http://source.office.bzdev.net';
var M_SEEDIT_COM = 'http://m.bozhong.com';
var BBS_SEEDIT_COM = 'http://bbs.office.bzdev.net';
var HUODONG_SEEDIT_COM = 'http://huodong.office.bzdev.net';
var STATIC_SEEDIT_COM = 'http://static.office.bzdev.net';
// block函数
var B = function(name){
	try {
		return fs.readFileSync( process.env.OLDPWD + '/cms/block/' + name + '.html', 'utf-8' );
	} catch(err) {
		return '<!-- '+name+' is not exist -->';
	}
}

// 获取php语法
function getPHP(contents){
	return !!contents.match(/<\?[=||php][^<\?||\?>]*\?>/g) ? contents.match(/<\?[=||php][^<\?||\?>]*\?>/g) : [];
}
// 通过php语法获取对应的变量或函数
function getEvent(php){
	var arr = [];
	for(var i=0; i<php.length; i++){
		arr[i] = php[i].replace(/<\?(php|=)?|\?>/g, '');
	}
	return arr;
}

module.exports = function(gulp){
	gulp.task('cms-block', function(){
		
	});

	gulp.task('sass', function(){
		/* 编译风格模板
		 *  - compressed：压缩后的css代码, 它是默认值
		 *  - nested：嵌套缩进的css代码
		 *  - expanded：没有缩进的、扩展的css代码
		 *  - compact：简洁格式的css代码
		 *
		 * 配置方式： 1. 直接通过以上四种类型字符来配置
		 *           2. 通过风格模板索引来配置配置
		 */
		var outputStyleTemplate = ['compressed', 'nested', 'expanded', 'compact'];
		var outputStyle = outputStyleTemplate[0];
		// 项目样式文件目录
		var cssDirs = path.join( process.env.INIT_CWD, 'css' );
		// 项目配置文件地址
		var confUrl = path.join( process.env.INIT_CWD, 'package.json' );
		// 项目配置文件内容
		var conf = !!fs.readFileSync( confUrl, 'utf-8' ) ? JSON.parse(fs.readFileSync( confUrl, 'utf-8' )) : {};
		// 设置默认编译配置
		var list = [{
			'from': path.join(cssDirs, 'style.scss'),
			'to': 'style.css',
			'outputStyle': outputStyleTemplate[0]
		}];
		// 对外部编译风格进行校正处理
		var getOutputStyle = function(outputStyle){
			if( typeof outputStyle === 'number' ){
				outputStyle = outputStyleTemplate[ outputStyle ] || outputStyleTemplate[0];
			} else if( typeof outputStyle === 'string' && !!outputStyle.match( new RegExp('^' + outputStyleTemplate.join('|') + '$', 'gi') ) ){
				outputStyle = outputStyle;
			} else {
				console.warn('[warn] outputStyle("'+ outputStyle +'") value must be a number or string!');
				outputStyle = outputStyleTemplate[0];
			}
			return outputStyle;
		}
		// 提取正确的编译配置
		if( !!conf.sass && conf.sass.length > 0 ){
			for( var i=0; i<conf.sass.length; i++ ){
				if( !!conf.sass[i].from && !!conf.sass[i].to && !!conf.sass[i].outputStyle ){
					if( conf.sass[i].from.match(/\.scss$/gi) && conf.sass[i].to.match(/\.css$/gi) ){
						if( i == 0 ) list = []; // 有正确的编译风格时，清除默认配置
						list.push({
							'from': path.join(process.env.INIT_CWD, conf.sass[i].from),
							'to': conf.sass[i].to,
							'outputStyle': getOutputStyle( conf.sass[i].outputStyle )
						});
					} else {
						// 编译源文件和目标文件必须是scss和css
						console.error('from: ("' + conf.sass[i].from + '") must be *.scss, to: ("' + conf.sass[i].to + '") must be *.css');
					}
				}
			}
		}
		// 多文件编译
		for( var i=0; i<list.length; i++ ){
			gulp.src( list[i].from )
				.pipe(sass({
	                outputStyle: list[i].outputStyle
	            }).on("error", sass.logError))
	            .pipe(rename(list[i].to))
				.pipe(gulp.dest(cssDirs));
		}
	});

	gulp.task('build', function(){
		// 项目配置文件地址
		var confUrl = path.join( process.env.INIT_CWD, 'package.json' );
		// 项目配置文件内容
		var conf = !!fs.readFileSync( confUrl, 'utf-8' ) ? JSON.parse(fs.readFileSync( confUrl, 'utf-8' )) : {};
		var dirs = fs.readdirSync( process.env.INIT_CWD );
		var filename = '';
		var A_url = ''
		var A_contents = '';
		var A_replace = [];
		var A_event = [];
		// 对项目配置文件的自定义变量进行初始化(!!有安全问题，仅供内部使用!!)
		if( !!conf.var ){
			for(var i in conf.var){
				global[i] = conf.var[i];
			}
		}
		// 对html文件进行编译
		for(var i=0; i<dirs.length; i++){
			filename = dirs[i].match(/^_.*\.html$/);
			if( !!filename ){
				// _html文件地址
				A_url = path.join(process.env.INIT_CWD, filename[0]);
				// _html内容
				A_contents = fs.readFileSync( A_url, 'utf-8' );
				// 需要编译的php
				A_replace = getPHP( A_contents );
				// 提取php语法
				A_event = getEvent( A_replace );
				// 编译php
				for(var j=0; j<A_replace.length; j++){
					try{
						A_contents = A_contents.replace(A_replace[j], eval(A_event[j]) );
					} catch(err){
						A_contents = A_contents.replace(A_replace[j], '['+err+']' );
					}
				}
				// 写入html文件
				fs.writeFile(A_url.replace('_',''), A_contents, 'utf-8');
			}
		}
	});

	gulp.task('wbuild', function(){
		var dirs = fs.readdirSync( process.env.INIT_CWD );
		var filename = '';
		var watchArray = [];
		// 获取项目根目录下的所有html文件
		for(var i=0; i<dirs.length; i++){
			filename = dirs[i].match(/^_.*\.html$/);
			if( !!filename ){
				watchArray.push( path.join(process.env.INIT_CWD, filename[0]) );
			}
		}
		filename = null;
		// 监听html文件
		gulp.watch(watchArray, ["build"]);
	});
}