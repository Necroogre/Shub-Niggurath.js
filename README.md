# Shub-Niggurath.js
前言：莎布·尼古拉丝(Shub-Niggurath)为外神(Outer Gods)之一，是一个拥有超强生殖力的神，在奥古斯特·威廉·德雷斯为克苏鲁神话构建的体系中，它是象征“地”的存在之一。
此处，Shub-Niggurath超强的生殖力象征着代码生成工具强大的生成能力，故引用此名。

## 1.下载地址
http://192.168.2.252:8090/pages/viewpage.action?pageId=1868116

## 2.与IntelliJ集成
想要更方便的使用此工具？那就在IntelliJ里添加一个外部工具吧！
### i. 打开IntelliJ-->File(菜单栏左上角)-->Setting-->Tools-->External Tools-->Add(绿色加号) 
### ii. 在Create Tool的弹窗中配置以下信息;
Program: *D:\App\codegenjs\codegenjs.exe* (请替换成代码生成工具的路径)  
Parameters: *--path="$ProjectFileDir$"* (生成工具Path的默认值)  
Working directory: *D:\App\codegenjs\*  
### iii. 配置完后，在菜单栏Tools-->External Tools里便能找到啦！
##3.使用方法
### i. 目前代码生成工具数据源支持sqlserver；所以生成前请先去sqlserver中将数据库，表先创建好，字段请加上说明(用于生成代码的注释)
### ii. 打开工具后，点开齿轮，配置数据库连接信息及命名空间，配好后点击刷新列表
### iii. 此时左边列表中会拉出数据库中所有的表，其中外键表会有FK标识，将鼠标放置标志上会显示外键关联信息
### iv. 将想生成的字段移至右边，填写Path(代码生成根目录)，确认后点击生成
##4.注意事项
### i. 若需生成文件已存在，生成工具并不会覆盖其文件，但是会在生成结束后界面下方以错误信息提示出来
### ii. 工具目录下的tmpl文件夹用于放置生成模板，可按需修改；cfg文件夹下的templates.json存有各模板的相对路径，对应着其生成的位置