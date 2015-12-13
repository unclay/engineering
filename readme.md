### 背景
产品、推广、运营的专题需求量上来后，随着老员工的离去，新员工的到来，部分专题的已经杂乱无章，难以查找，这时候必须规范专题活动

### 专题工程化
为了便于开发，专题工程化必须被推上前沿。首先，为了更加吻合公司cms的开发模式，将cms各项基本引入本次工程化中

### 工程化方式
+ 动态html文件 (_index.html -> index.html)
+ 动态变量 <?=SOURCE_UNCLAY_COM?>
+ 动态block <?=B('我是一个模块')?>
+ 各专题根目录配置文件package.json
+ 通过配置自动打包css,js,sass等等
+ gulp help帮助命令

### package.json详解
+ name 专题名称
+ description 专题描述
+ url [线上地址, online地址, office地址]
+ api [各个api地址]

### gulp配置
````
sudo npm install gulp -g // 安装全局gulp，为了生成全局gulp命令
sudo npm install gulp --save-dev // 项目中安装gulp，为了项目有gulp执行依赖
````

### 思路
1. 建立build任务  
读取项目下package.json文件, 并读取项目下面的_*.html文件转为*.html(如：_index.html -> index.html)
````
gulp.task('build', function(){
	var confUrl = path.join( process.env.INIT_CWD, 'package.json' );
	var conf = require(confUrl);
	var dirs = fs.readdirSync( process.env.INIT_CWD );
	var filename = '';
	var A_url = ''
	var A_contents = '';
	for(var i=0; i<dirs.length; i++){
		filename = dirs[i].match(/^_.*\.html$/);
		if( !!filename ){
			A_url = path.join(process.env.INIT_CWD, filename[0]);
			A_contents = fs.readFileSync( A_url, 'utf-8' );
			fs.writeFileSync(A_url.replace('_',''), A_contents, 'utf-8');
		}
	}
});
````

2. 建立wbuild任务  
监听项目下面的_*.html文件（如：把_index.html转为index.html）
````
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
````

3. 获取php语法   
从html提取php语法（array）
````
function getPHP(contents){
	return !!contents.match(/<\?[=||php][^<\?||\?>]*\?>/g) ? contents.match(/<\?[=||php][^<\?||\?>]*\?>/g) : [];
}
````

4. 转换php语法
从php语法（array）提取对应的变量及其函数
````
function getEvent(php){
	var arr = [];
	for(var i=0; i<php.length; i++){
		arr[i] = php[i].replace(/<\?(php|=)?|\?>/g, '');
	}
	return arr;
}
````

5. 读取package.json变量  
从package.json读取到conf, 并把其中变量var的属性及其值转成全局变量
````
if( !!conf.var ){
	for(var i in conf.var){
		global[i] = conf.var[i];
	}
}
````

6. block函数
````
// block函数
var B = function(name){
	try {
		return fs.readFileSync( process.env.OLDPWD + '/cms/block/' + name + '.html', 'utf-8' );
	} catch(err) {
		return '<!-- '+name+' is not exist -->';
	}
}
````

7. 合并处理  
读取文件后处理，并替换对应的动态变量，如域名
````
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
````

8. sass处理  
根据package.json来编译sass, 当没有配置时以下便是默认配置值
````json
{
	"sass": {
		"from": "style.scss",
		"to": "style.css",
		"outputStyle": "compressed"
	}
}
````
实现方式
````
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
			if( !!conf.sass[i].from && !!conf.sass[i].to ){
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
````
watch sass
````
gulp.task('wsass', function(){
    gulp.watch( process.env.INIT_CWD + "/*/*.scss", ["sass"]);
});
````

9. 获取gulpfile根目录
````javascript
var getRoot = function(){
	var root = process.env.PWD;
	// 寻找根目录
	while( !fs.existsSync( root + '/gulpfile.js' ) ){
		root = path.join(root, '/..');
	}
	return root;
}
````

10. 拉取cms
通过conf.json配置文件进行拉取公共block到跟目录下的/cms/block
````javascript
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
	if( !!_conf.sass && _conf.sass.length > 0 ){
		for( var i=0; i<_conf.sass.length; i++ ){
			if( !!_conf.sass[i].from && !!_conf.sass[i].to && !!_conf.sass[i].outputStyle ){
				if( _conf.sass[i].from.match(/\.scss$/gi) && _conf.sass[i].to.match(/\.css$/gi) ){
					if( i == 0 ) list = []; // 有正确的编译风格时，清除默认配置
					list.push({
						'from': path.join(CWD, _conf.sass[i].from),
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
````

11. 打包压缩css
````
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
````