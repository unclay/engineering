seajs.config({
	base: (function(){
		return '../moe'
	}()),
	paths: {
		
	}
	// alias: {
	// 	"jquery": "jquery/1.8.3/jquery.js"
	// },
	// preload: ["jquery"]
});
// jQuery暴露到全局
	// 2.1.1开始移除modify
	// seajs.modify("jquery", function(require, exports){
	// 	window.jQuery = window.$ = exports;
	// });
// seajs.on('exec', function(module) {
//    if (module.uri === seajs.resolve('jquery')) {
//     	window.$ = window.jQuery = module.exports
//    }
// })
// seajs.use("jquery",function($){
// 	window.jQuery = window.$ = $;
// })