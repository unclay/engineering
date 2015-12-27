'use strict';
var colors = require('colors');
var fs = require('fs');

// 兼容多系统，多版本node
var CWD = process.env.PWD || CWD || process.cwd() || '';
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
  
//bold  
//italic  
//underline  
//inverse  
//yellow  
//cyan  
//white  
//magenta  
//green  
//red  
//grey  
//blue  
//rainbow  
//zebra  
//random  
module.exports = function(gulp){
	gulp.task('help', function(){
		var filePath = root + '/tool/help.md';
		var first = 0; // 是否为第一个元素
		var logTypeList = []; // 日志类型
		if( fs.existsSync(filePath) ){
			var help = fs.readFileSync(filePath, 'utf-8');
			help = help.split('\n');
			for(var i=0; i<help.length; i++){
				if( !!(help[i].replace(/\s/gi, '')) ){
					first++;
				}				
				// 第一个元素设置green日志类型
				if( first === 1 ){
					logTypeList[i] = 'green';
				}
				// 当前文档的上一行文档是'---------'换行符时，设置当前行为green日志类型
				if( !!help[i] && !!(help[i].match(/(-){5}/gi)) ){
					logTypeList[i+1] = 'green';
					help[i] = '';
				}
				// 设置当前行默认日志类型为help
				if( !logTypeList[i] ){
					logTypeList[i] = 'help';
				}
				try {
					eval( 'console.log( (help[i]).' + logTypeList[i] + ' )' )
				} catch(err){
					console.log('[ERROR] /tool/help.md 文档解析异常'.error);
				}
			}
		} else {
			console.log('[WARN] /tool/help.md 文件不存在'.warn);
		}


		console.log('\n');
		console.log('hello'.green); // outputs green text  
		console.log('i like cake and pies'.underline.red) // outputs red underlined text  
		console.log('inverse the color'.inverse); // inverses the color  
		console.log('OMG Rainbows!'.rainbow); // rainbow (ignores spaces)  
		  
		console.log('this is an error'.error);  
		console.log('this is a warning'.warn);  
		console.log('this is a debug'.debug);  
		console.log('this is a help'.help);  
		console.log('this is a silly'.silly);  
		console.log('this is a input'.input);  
		console.log('this is a prompt'.prompt);  
		console.log('this is a data'.data); 
		
	});
}