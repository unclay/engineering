'use strict';

var path = require('path');
var fs = require('fs');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var request = require('superagent');
var cssmin = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
// gulp-minify-css options
//   advanced: false,//类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
//   compatibility: 'ie7',//类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
//   keepBreaks: true//类型：Boolean 默认：false [是否保留换行]

// del
var rjs = require('gulp-requirejs');
var cmdPack = require('gulp-cmd-pack');
var requirejsOptimize = require('gulp-requirejs-optimize');
var seajsCombo = require( 'gulp-seajs-combo' );
// var gulpSeajs = require('gulp-seajs');

// 兼容多系统，多版本node
var CWD = process.env.PWD || CWD || process.cwd() || '';
// 获取gulpfile根目录
var getRoot = function(){
	try{
		var root = CWD;
		if( !root ){
			console.error('应用根目录找不到~');
			return false;
		}
		// 寻找根目录
		while( !fs.existsSync( root + '/gulpfile.js' ) ){
			root = path.join(root, '/..');
		}
		return root;
	} catch(err){
		console.error(err);
	}
}
var root = getRoot();
// block函数
function B(name){
	try {
		return fs.readFileSync( root + '/cms/block/' + name + '.html', 'utf-8' );
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
	gulp.task('cms', function(){
		var conf = require('./conf.json');
		var root = getRoot();
		var cms = conf.cms;
		// 不存在目录就新增CMS目录
		if( !fs.existsSync(root+'/cms') ){
			fs.mkdirSync(root+'/cms');
		}
		if( !fs.existsSync(root+'/cms/block') ){
			fs.mkdirSync(root+'/cms/block');
		}
		root = root + '/cms/block';
		var i = 0;
		var len = conf.cms.block.length;
		var cmsUrl = '';
		// 采用递归方式拉取block
		var pull = function(){
			cmsUrl = cms.url + '?type=block&id=' + conf.cms.block[i];
			request.get( cmsUrl )
					// .set('accept', 'application/json')
					.end(function(err, res){
						if( !!err ){
							return console.error( conf.cms.block[i] + ' status is ' + err.status);
						}
						var name = res.text.match(/\^{[^\^{}]*}\^/gi);
						if( !name ){
							console.error(conf.cms.block[i] + '\'s name can not undefined');
						} else {
							name = name[0].replace(/[\^{|}\^]/gi, '');
							fs.writeFile( root + '/' + name + '.html', res.text, 'utf-8', function(err, data){
								if(!!err) console.log(err);
								else console.log( conf.cms.block[i] + ' ' + name + ' success');
							} );
						}
						if( i < len-1 ){
							i++;
							pull();
						}
					});
		}
		pull();
	});

	gulp.task('css', function(){
		// 项目样式文件目录
		var cssDirs = path.join( CWD, 'css' );
		// 项目配置文件地址
		var confUrl = path.join( CWD, 'package.json' );
		// 项目配置文件内容
		var _conf = fs.readFileSync( confUrl, 'utf-8' );
		try{
			_conf = !!_conf ? _conf : '{}';
			_conf = JSON.parse(_conf);
		} catch(err){
			console.error('package.json格式不对，' + err);
		}
		var minConf = {};
		if( !!_conf.css && !!_conf.css.options ){
			if( Object.prototype.toString.call(_conf.css.options) !== '[object Object]' ){
				console.error('package.json.css.options must be Object');
			} else {
				minConf = _conf.css.options;
			}
		}
		gulp.src(cssDirs + '/*.css')
			.pipe(cssmin(minConf))
			.pipe(rename('style.min.css'))
			.pipe(gulp.dest(cssDirs));
	});

	gulp.task('wcss', function(){
		gulp.watch( CWD + "/css/*.css", ["css"]);
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
		var cssDirs = path.join( CWD, 'css' );
		// 项目配置文件地址
		var confUrl = path.join( CWD, 'package.json' );
		// 项目配置文件内容
		var _conf = fs.readFileSync( confUrl, 'utf-8' );
		try{
			_conf = !!_conf ? _conf : '{}';
			_conf = JSON.parse(_conf);
		} catch(err){
			console.error('package.json格式不对，' + err);
		}
		// 设置默认编译配置
		var list = [{
			'from': path.join(cssDirs, 'style.scss'),
			'to': path.join(cssDirs, 'style.css'),
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
		if( !!_conf.sass && _conf.sass.length > 0 ){
			for( var i=0; i<_conf.sass.length; i++ ){
				if( !!_conf.sass[i].from && !!_conf.sass[i].to && !!_conf.sass[i].outputStyle ){
					if( _conf.sass[i].from.match(/\.scss$/gi) && _conf.sass[i].to.match(/\.css$/gi) ){
						if( i == 0 ) list = []; // 有正确的编译风格时，清除默认配置
						list.push({
							'from': path.join(CWD, path.normalize(_conf.sass[i].from).replace(CWD, '') ),
							'to': _conf.sass[i].to,
							'outputStyle': getOutputStyle( _conf.sass[i].outputStyle )
						});
					} else {
						// 编译源文件和目标文件必须是scss和css
						console.error('from: ("' + _conf.sass[i].from + '") must be *.scss, to: ("' + _conf.sass[i].to + '") must be *.css');
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

	// watch sass
	gulp.task('wsass', function(){
	    gulp.watch( CWD + "/*/*.scss", ["sass"]);
	});

	// 压缩js
	gulp.task('moe', function(){
		console.log( process.env );
		// 项目配置文件地址
		var confUrl = path.join( CWD, 'package.json' );
		// 项目配置文件内容
		var conf = !!fs.readFileSync( confUrl, 'utf-8' ) ? JSON.parse(fs.readFileSync( confUrl, 'utf-8' )) : {};
		console.log( path.join(process.env.OLDPWD, "/moe/") );
		// gulp.src( path.join( CWD, 'js/main.js' ) )
		// 	.pipe(seajsCombo({
		// 		base: process.env.OLDPWD + "/moe/"
		// 	}))
		// 	.pipe( rename("index.min.js") )
		// 	.pipe(gulp.dest( path.join( CWD, 'js' ) ));
		gulp.src( path.join( CWD, 'js/main.js' ) )
			.pipe(gulpSeajs({
				mode: 2
			}))
			.pipe( rename("index.min.js") )
			.pipe(gulp.dest( path.join( CWD, 'js' ) ));
		// gulp.src( path.join( CWD, 'js/index.js' ) )
		// 	.pipe( requirejsOptimize(function(file){
		// 		console.log("file start",file);
		// 		console.log("file end");
		// 		return {
		// 			baseUrl: "/"
		// 		};
		// 	}) )
		// 	.pipe( rename('index.min.js') )
		// 	.pipe( gulp.dest( path.join( CWD, 'js' ) ) );
	});

	gulp.task('build', function(){
		var conf = require('./conf.json');
		// 项目配置文件地址
		var confUrl = path.join( CWD, 'package.json' );
		// 项目配置文件内容
		var _conf = fs.readFileSync( confUrl, 'utf-8' );
		try{
			_conf = !!_conf ? _conf : '{}';
			_conf = JSON.parse(_conf);
		} catch(err){
			console.error('package.json格式不对，' + err);
		}
		var dirs = fs.readdirSync( CWD );
		var filename = '';
		var A_url = ''
		var A_contents = '';
		var A_replace = [];
		var A_event = [];
		// 系统配置变量
		if( !!conf.domain ){
			for(var i in conf.domain){
				global[i] = conf.domain[i];
			}
		}
		// 对项目配置文件的自定义变量进行初始化(!!有安全问题，仅供内部使用!!)
		if( !!_conf.var ){
			for(var i in _conf.var){
				global[i] = _conf.var[i];
			}
		}
		// 对html文件进行编译
		for(var i=0; i<dirs.length; i++){
			filename = dirs[i].match(/^_.*\.html$/);
			if( !!filename ){
				// _html文件地址
				A_url = path.join(CWD, filename[0]);
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
		var dirs = fs.readdirSync( CWD );
		var filename = '';
		var watchArray = [];
		// 获取项目根目录下的所有html文件
		for(var i=0; i<dirs.length; i++){
			filename = dirs[i].match(/^_.*\.html$/);
			if( !!filename ){
				watchArray.push( path.join(CWD, filename[0]) );
			}
		}
		filename = null;
		// 监听html文件
		gulp.watch(watchArray, ["build"]);
	});

	gulp.task('js', function(){
		var conf = require('./conf.json');
		// 项目配置文件地址
		var confUrl = path.join( CWD, 'package.json' );
		// 项目配置文件内容
		var _conf = fs.readFileSync( confUrl, 'utf-8' );
		try{
			_conf = !!_conf ? _conf : '{}';
			_conf = JSON.parse(_conf);
		} catch(err){
			console.error('package.json格式不对，' + err);
		}
		// 必须配置js压缩入口文件才能执行
		if( !_conf.applition.js ){
			return console.error('package.json必须配置application["js"]项');
		}
		var jsConf = _conf.applition.js;
		jsConf = jsConf || {};
		jsConf.mainName = jsConf.from.match(/[^\/]+\.js/);
		jsConf.mainName = !!jsConf.mainName ? jsConf.mainName[0] : '';
		jsConf.mainToName = jsConf.to.match(/[^\/]+\.js/);
		jsConf.mainToName = !!jsConf.mainToName ? jsConf.mainToName[0] : jsConf.mainName.replace('.js', '.min.js');
		jsConf.mainModule = jsConf.module.match(/[^\/]+\.js/);
		jsConf.mainModule = !!jsConf.mainModule ? jsConf.mainModule[0] : 'modules.js';
		if( !jsConf.mainName ){
			return console.error('js的入口文件不能为空');
		}
		// 最终打包路径数组
		var allModules = [];
		var mainJs = path.join( CWD, jsConf.from );
		var mainJsContent = fs.readFileSync( mainJs, 'utf-8' );
		mainJsContent = mainJsContent.match(/require\([^\);]*\)/gi);
		for(var i=0; i<mainJsContent.length; i++){
			var name = eval(mainJsContent[i].replace('require','_require'));
			allModules = allModules.concat(name);
		}
		function _require(path){
			return [path].concat( _getModules(path) );
		}
		function _getModules(path){
			try {
				var path = root + '/moe/' + path + '.js';
				if( !fs.existsSync(path) ){
					return [];
				}
				var content = fs.readFileSync(path, 'utf-8');
				var modules = [];
				var subModules = [];
				var delModules = [];
				var temp = [];
				if( !content ){
					return [];
				}
				content = content.split(/define\(/gi);
				if( content.length <= 0 ){
					return [];
				}
				// console.log( content );

				for( var i=1; i<content.length; i++ ){
					if(!content[i]){
						i--;
					} else {
						// console.log( content[i].substr(0, content[i].lastIndexOf(')') + 1 ) );
						// console.log( eval('_define(' + content[i]) );
						// console.log( '_define(' + content[i].substr(0, content[i].lastIndexOf(')') + 1 ) );
						temp = eval('_define(' + content[i].substr(0, content[i].lastIndexOf(')') + 1 ));
						if( temp.dep.length > 0 ) modules = modules.concat( temp.dep );
						if( !!temp.name ) delModules.push( temp.name );
					}
				}
				// 删除重复的依赖文件
				for( var i=0; i<delModules.length; i++ ){
					for( var j=0; j<modules.length; j++ ){
						if( delModules[i] === modules[j] ){
							modules.splice(j,1);
							continue;
						}
					}
				}
				// 提取依赖里面的依赖文件
				for( var i=0; i<modules.length; i++ ){
					subModules = subModules.concat( _getModules(modules[i]) );
				}
				// 把所有子组件文件加入到组件集合里面
				modules = modules.concat( subModules );
				return modules;
			} catch(err){
				console.log('_getModules: ', err);
			}
		}
		// 提取define的name、dep
		function _define(name, dep){
			return {
				name: name,
				dep: dep
			}
		}

		// 打包的文件数组转换成实际路径
		for( var i=0; i<allModules.length; i++ ){
			allModules[i] = allModules[i].indexOf('.') === 0 ? path.join(CWD, 'js', allModules[i]) : path.join(root, 'moe', allModules[i] + '.js');
		}
		// 压缩入口文件
		gulp.src(mainJs)
			.pipe(uglify())
			.pipe(rename(jsConf.mainToName))
			.pipe(gulp.dest( path.join(CWD, jsConf.to).replace(/\/[^\/]+\.js$/, '') ));
		// 压缩打包组件文件
		gulp.src(allModules)
			.pipe(uglify())
			.pipe(concat(jsConf.mainModule))
			.pipe(gulp.dest( path.join(CWD, jsConf.module).replace(/\/[^\/]+\.js$/, '') ));

	});

	// watch js
	gulp.task('wjs', function(){
	    gulp.watch( CWD + "/js/index.js", ["js"]);
	});
}