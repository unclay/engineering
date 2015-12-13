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
````
{
	"name": "测试工程化",
	"var": {
		"WWW_SITE_COM": "http://www.unclay.com",
		"SOURCE_SITE_COM": "http://source.unclay.com"
	},
	"sass": [{
		"from": "sass/test_1_1.scss",
		"to": "css/style.css",
		"outputStyle": 3
	}],
	"css": {
		"options": {
			"keepBreaks": true
		}
	},
	"applition": { // 应用程序配置内容地方
		"js": { // 压缩打包js
			"from": "js/index.js", // 必填
			"to": "js/index.min.js", // 选填
			"module": "js/modules.js", // 选填
			"watch": [ // 监听变更文件
				"js/index.js"
			]
		}
	}
}
````


### gulp配置
````
sudo npm install gulp -g // 安装全局gulp，为了生成全局gulp命令
sudo npm install gulp --save-dev // 项目中安装gulp，为了项目有gulp执行依赖
````

### 功能介绍
+ 打包压缩js
````
gulp js // 直接打包js，1.入口文件压缩 2.组件文件打包压缩
gulp wjs // 监听并打包js
````
配置参数包含四个
	+ from js入口文件
 

### 思路
