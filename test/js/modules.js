define("loginBox/0.0.3/index",["box/0.0.1/index","user/0.0.2/index"],function(e,i,n){e("box/0.0.1/index"),e("user/0.0.2/index");console.log("this is loginBox module")});
define("box/0.0.1/index",["dialog/0.0.4/index","dialog/0.0.2/css/style.css"],function(s,o,i){s("dialog/0.0.4/index"),s("dialog/0.0.2/css/style.css");console.log("this is loginBox module")}),define("dialog/0.0.2/css/style.css",[],function(s,o,i){console.log("this is dialog css module")});
define("user/0.0.2/index",["base/0.0.1/index"],function(e,i,n){e("base/0.0.1/index");console.log("this is user module")});
define("dialog/0.0.4/index",[],function(i,o,d){console.log("this is dialog module")});
define("base/0.0.1/index",[],function(e,i,n){console.log("this is base module")});
define("ui/0.0.5/ui",["base/0.0.1/index"],function(i,e,n){console.log("this is ui module")});
"use strict";define(function(e,i,n){console.log("this is a internal module ")});
define(function(e,o,i){console.log("this is a vue module")});