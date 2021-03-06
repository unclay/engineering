'use strict';

var path = require('path');
var fs = require('fs');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var request = require('superagent');
var cssmin = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var colors = require('colors');

colors.setTheme({  
    silly: 'rainbow',  
    input: 'grey',  
    verbose: 'cyan',  
    prompt: 'red',  
    info: 'green',
    data: 'blue',  
    help: 'cyan',  
    warn: 'yellow',  
    debug: 'magenta',  
    error: 'red'  
});
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
var CWD = process.env.INIT_CWD || process.env.PWD || process.cwd() || '';
var root = getRoot();
// 获取gulpfile根目录
function getRoot(){
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

	gulp.task('sass1', function(){
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
			console.log( list[i].from );
			gulp.src( list[i].from )
				.pipe(sass({
	                outputStyle: list[i].outputStyle
	            }).on("error", sass.logError))
	            .pipe(rename(list[i].to))
				.pipe(gulp.dest(cssDirs));
		}
	});

	// watch sass
	gulp.task('wsass1', function(){
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
		try {
			var _conf = require(CWD + '/package.json');
		} catch(err){
			return console.log( ('[ERROR] ' + CWD + '/package.json not found').error );
		}
		// 必须配置js压缩入口文件才能执行
		if( !_conf.applition.js ){
			return console.log( ('[ERROR] package.json.application.js must exist, and must be the Object').error );
		}
		var moduleDirs = conf.module || 'moe';
		var jsConf = _conf.applition.js;
		jsConf = jsConf || {};
		// 入口文件名
		jsConf.mainName = !!jsConf.from ? jsConf.from.match(/[^\/]+\.js/) : '';
		jsConf.mainName = !!jsConf.mainName ? jsConf.mainName[0] : '';
		// 压缩文件名
		jsConf.to = !!jsConf.to ? jsConf.to : jsConf.from.replace('.js', '.min.js')
		jsConf.mainToName = !!jsConf.to ? jsConf.to.match(/[^\/]+\.js/) : '';
		jsConf.mainToName = !!jsConf.mainToName ? jsConf.mainToName[0] : jsConf.mainName.replace('.js', '.min.js');
		console.log( jsConf.mainToName );
		// 模块集合文件名
		jsConf.mainModule = !!jsConf.module ? jsConf.module.match(/[^\/]+\.js/) : '';
		jsConf.mainModule = !!jsConf.mainModule ? jsConf.mainModule[0] : '';
		if( !jsConf.mainName ){
			return console.log('[ERROR] package.json.application.js.from must be a xxxx.js'.error);
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
		// 引入依赖文件
		function _require(path){
			return [path].concat( _getModules(path) );
		}
		function _getModules(path){
			try {
				var path = root + '/' + moduleDirs + '/' + path + '.js';
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
				// 一个文件可能存在多个define事件，循环提取子依赖和内部依赖
				for( var i=1; i<content.length; i++ ){
					if(!content[i]){
						i--;
					} else {
						var _item = '_define(' + content[i].substr(0, content[i].indexOf('function')) + '"")';
						// console.log( _item );
						// if( _item.length < 15 ){
						// 	console.log( content[i] );
						// }
						temp = eval(_item);
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

				console.log( ('[ERROR] _getModules: ' + err).error );
			}
		}
		// 提取define的name、dep
		function _define(name, dep){
			return {
				name: name || '',
				dep: dep || []
			}
		}
		// 剔除重复文件及微信文件
		var oneAllModules = {};
		for( var i=0; i<allModules.length; i++ ){
			if( allModules[i].indexOf("res.wx.qq.com") < 0 ) oneAllModules[allModules[i]] = true;
		}
		allModules = [];
		for( var i in oneAllModules ){
			allModules.push( i );
		}
		// 打包的文件数组转换成实际路径
		for( var i=0; i<allModules.length; i++ ){
			allModules[i] = allModules[i].indexOf('.') === 0 ? path.join(CWD, 'js', allModules[i]) : path.join(root, moduleDirs, allModules[i] + '.js');
		}
		
		// 调试日志
		if( jsConf.debug === true ){
			console.log( ('[DEBUG] 打包压缩文件数：' + allModules.length + '个，包含：').debug );
			for( var i=0; i<allModules.length; i++ ){
				console.log( ('[DEBUG]   ' + allModules[i]).debug );
			}
			if( jsConf.mainModule ){
				console.log( ('[DEBUG] 压缩结果-组件文件：' + jsConf.mainModule).debug );
				console.log( ('[DEBUG] 压缩结果-组件目录：' + path.join(CWD, jsConf.module.replace('\\'+jsConf.mainModule, '').replace('/'+jsConf.mainModule, '') )).debug );
			}
			console.log( ('[DEBUG] 压缩结果-入口文件：' + jsConf.mainToName).debug );
			console.log( ('[DEBUG] 压缩结果-入口目录：' + path.join(CWD, jsConf.to.replace('\\'+jsConf.mainToName, '').replace('/'+jsConf.mainToName, '') )).debug );
		}

		if( !!jsConf.mainModule ){
			// 压缩打包组件文件
			gulp.src(allModules)
				.pipe(uglify())
				.pipe(concat(jsConf.mainModule))
				.pipe(gulp.dest( path.join(CWD, jsConf.module.replace('\\'+jsConf.mainModule, '').replace('/'+jsConf.mainModule, '') ) ));
		} else {
			// 不存在组件集合独立文件时，打包进入口文件
			mainJs = allModules.concat([mainJs]);
		}
		// 压缩入口文件
		gulp.src(mainJs)
			.pipe(uglify())
			.pipe(concat(jsConf.mainToName))
			.pipe(gulp.dest( path.join(CWD, jsConf.to.replace('\\'+jsConf.mainToName, '').replace('/'+jsConf.mainToName, '') ) ));
	});

	// watch js
	gulp.task('wjs', function(){
		// 项目配置文件地址
		try {
			var _conf = require(CWD + '/package.json');
		} catch(err){
			return console.log( ('[ERROR] ' + CWD + '/package.json not found').error );
		}
		// 必须配置js压缩入口文件才能执行
		if( !_conf.applition.js ){
			return console.log( ('[ERROR] package.json.application.js must exist, and must be the Object').error );
		}
		var jsConf = _conf.applition.js;
		jsConf = jsConf || {};
		var mainJs = path.join( CWD, jsConf.from );
		var watch = [mainJs];
		// 加载外部自定义的变更文件
		if( Object.prototype.toString.call(jsConf.watch) === '[object Array]' ){
			for(var i=0; i<jsConf.watch.length; i++){
				if( jsConf.watch[i] == jsConf.from ) continue;
				watch.push( path.join( CWD, jsConf.watch[i]) );
			}
		} else {
			if( !!jsConf.watch ) console.log('[WARN] package.json.application.js.watch isn\'t Array'.warn);
		}
	    gulp.watch( watch, ["js"]);
	});

	// 压缩css
	gulp.task('css', function(){
		/* 压缩css配置
		 *  - options @{Json}    压缩配置
		 *  - from    @{Array}   打包压缩集合
		 *  - to      @{String}  压缩成什么文件
		 *  - debug   @{Boolean} debug模式（true or false）
		 */
		try {
			var _conf = require(CWD + '/package.json');
		} catch(err){
			return console.log( ('[ERROR] ' + CWD + '/package.json not found').error );
		}
		var cssOptions = {};
		var cssName = 'style.min.css';
		var cssPath = CWD + '/css';
		var cssArr = [cssPath + '/style.css'];
		// 存在配置时，提取配置
		if( !!_conf.applition && !!_conf.applition.css ){
			var cssConf = _conf.applition.css;
			// 打包压缩配置参数
			if( !!cssConf.options ){
				if( Object.prototype.toString.call(cssConf.options) !== '[object Object]' ){
					console.log('[WARN] package.json.css.options must be Object'.warn);
				} else {
					cssOptions = cssConf.options;
				}
			}
			// 打包压缩的文件集合（Array）
			if( !!cssConf.from && Object.prototype.toString.call(cssConf.from) === '[object Array]' ){
				cssArr = [];
				for( var i=0; i<cssConf.from.length; i++ ){
					cssArr.push( path.join(CWD, cssConf.from[i]) );
				}
			}
			// 压缩结果文件名
			if( !!cssConf.to ){
				cssConf.toName = !!cssConf.to ? cssConf.to.match(/[^\/]+\.css$/) : '';
				cssName = !!cssConf.toName ? cssConf.toName[0] : cssName;
				cssPath = path.join(CWD, cssConf.to).replace(/\/[^\/]+\.css$/, '') || cssPath;
			}
			// 调试日志
			if( cssConf.debug === true ){
				console.log( ('[DEBUG] 打包压缩文件数：' + cssArr.length + '个，包含：').debug );
				for( var i=0; i<cssArr.length; i++ ){
					console.log( ('[DEBUG]   ' + cssArr[i]).debug );
				}
				console.log( ('[DEBUG] 压缩配置： ' + JSON.stringify(cssOptions)).debug );
				console.log( ('[DEBUG] 压缩结果文件：' + cssName).debug );
				console.log( ('[DEBUG] 压缩结果目录：' + cssPath).debug );
			}
		}
		gulp.src(cssArr)
			.pipe(cssmin(cssOptions))
			.pipe(concat(cssName))
			.pipe(gulp.dest(cssPath));
	});

	gulp.task('wcss', function(){
		gulp.watch( CWD + "/*/*.css", ["css"]);
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
		try {
			var _conf = require(CWD + '/package.json');
		} catch(err){
			return console.log( ('[ERROR] ' + CWD + '/package.json not found').error );
		}
		// 设置默认编译配置
		var list = [{
			'from': path.join(CWD, 'css/style.scss'),
			'to': path.join(CWD, 'css/style.css'),
			'name': 'style.css',
			'dirs': CWD + '/css',
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
		if( !!_conf.applition && _conf.applition.sass ){
			var sass = _conf.applition.sass;
			if( !!sass && sass.length > 0 ){
				for( var i=0; i<_conf.sass.length; i++ ){
					if( !!_conf.sass[i].from && !!_conf.sass[i].to && !!_conf.sass[i].outputStyle ){
						if( _conf.sass[i].from.match(/\.scss$/gi) && _conf.sass[i].to.match(/\.css$/gi) ){
							if( i == 0 ) list = []; // 有正确的编译风格时，清除默认配置
							var name = !!jsConf.from ? jsConf.from.match(/[^\/]+\.js/) : '';
							name = !!name ? name[0] : '';
							list.push({
								'from': path.join(CWD, path.normalize(_conf.sass[i].from).replace(CWD, '') ),
								'to': _conf.sass[i].to,
								'name': name,
								'dirs': path.join(CWD, _conf.sass[i].to).replace(/\/[^\/]+\.css$/, ''),
								'outputStyle': getOutputStyle( _conf.sass[i].outputStyle )
							});
						} else {
							// 编译源文件和目标文件必须是scss和css
							console.error('from: ("' + _conf.sass[i].from + '") must be *.scss, to: ("' + _conf.sass[i].to + '") must be *.css');
						}
					}
				}
			}
			
		}
		if( _conf.debug === true ){
			for( var i=0; i<list.length; i++ ){
				console.log( ('[DEBUG] sass来源(' + i + '): ' + list[i].from).debug );
				console.log( ('[DEBUG] sass配置(' + i + '): ' + list[i].outputStyle).debug );
				console.log( ('[DEBUG] sass结果文件(' + i + '): ' + list[i].name).debug );
				console.log( ('[DEBUG] sass结果目录(' + i + '): ' + list[i].dirs).debug );
			}
		}
		// 多文件编译
		for( var i=0; i<list.length; i++ ){
			gulp.src( list[i].from )
				.pipe(sass({
	                outputStyle: list[i].outputStyle
	            }).on("error", sass.logError))
	            .pipe(rename(list[i].name))
				.pipe(gulp.dest(list[i].dirs));
		}
	});

	// watch sass
	gulp.task('wsass', function(){
	    gulp.watch( CWD + "/*/*.scss", ["sass"]);
	});
}