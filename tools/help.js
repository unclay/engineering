'use strict';
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
		console.log('  常用gulp快捷键有：\n'.green);
		console.log('    gulp version       查看可以更新上线的版本'.help);
		console.log('    gulp pull          拉取当前分支最新的内容到本地'.help);
		console.log('    gulp deploy        拉取当前分支最新的内容，再上线product，并清除cdn缓存'.help);
		console.log('    gulp help          gulp参数说明'.help);
		console.log('    gulp clean         清除cdn缓存'.help);
		console.log('      gulp clean --url common/js/jquery.min.js         清除单文件缓存'.help);
		console.log('      gulp clean --url common/js/jquery.min.js --all   清除单文件的所有带参数的缓存'.help);
		console.log('      gulp clean --url common/js/ --all                清除目录缓存'.help);
		console.log('    gulp common             合并压缩生成common_v2.min.css及common.min.js'.help);
		console.log('    gulp bbs                bbs_v3.css及 bbs_v3.js及相关文件'.help);
		console.log('    gulp block_cache        cms所有的block_cache任务'.help);
		console.log('    gulp zj_cache           清除专家问答相关block缓存'.help);
		console.log('    gulp huodong_cache      清除福利频道相关block缓存'.help);
		console.log('    gulp bbs_cache          清除 bbs后台的风格缓存'.help);
		console.log('    gulp zj_cache           清除专家问答相关block缓存'.help);
		console.log('    gulp zj_cache           清除专家问答相关block缓存'.help);

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