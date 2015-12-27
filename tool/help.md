  
  常用gulp快捷键有：
    gulp version            查看可以更新上线的版本
    gulp pull               拉取当前分支最新的内容到本地
    gulp deploy             拉取当前分支最新的内容，再上线product，并清除cdn缓存
    gulp help               gulp参数说明
------------------------------------
  清除缓存快捷命令：
    gulp clean         清除cdn缓存
      gulp clean --url common/js/jquery.min.js         清除单文件缓存
      gulp clean --url common/js/jquery.min.js --all   清除单文件的所有带参数的缓存
      gulp clean --url common/js/ --all                清除目录缓存
    gulp block_cache        cms所有的block_cache任务
    gulp zj_cache           清除专家问答相关block缓存
    gulp huodong_cache      清除福利频道相关block缓存
    gulp bbs_cache          清除 bbs后台的风格缓存
    gulp zj_cache           清除专家问答相关block缓存
------------------------------------
  自动化开发快捷命令（待定）：
    gulp cms                拉取cms的block到版本库下的/cms/block (格式：<!-- ^{WAP_V2_头部声明}^ -->)
    gulp sass               一次行编译css目录的scss文件
    gulp wsass              监听scss文件并编译(watch sass)
    gulp build              一次性编译文件 _*.html => *.html
    gulp wbuild             监听_*.html文件并编译(watch build)
------------------------------------
  打包压缩快捷命令：
    gulp common             合并压缩生成common_v2.min.css及common.min.js
    gulp bbs                bbs_v3.css及 bbs_v3.js及相关文件
