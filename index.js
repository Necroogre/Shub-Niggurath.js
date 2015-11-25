var path = require('path');
var configHelper = require('./cfg');
//this main.js file is wrapped in 'app' directory.
//but the application is started from 'electron.exe'
//change cwd at the beginning to make all relative path work properly.
process.chdir(path.resolve(__dirname, './'));

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var ipc = require('ipc');
var glob = require("glob");
//app was wrapped by electron.exe, so slice the first argument(electron.exe's path)
var argv = require('yargs').parse(process.argv.slice(1));



// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var cfgHelper = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform != 'darwin') {
		app.quit();
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
	// Create the browser window.
	mainWindow = new BrowserWindow({ width: 700, height: 675, frame: false, resizable: false, transparent: false });


	// and load the index.html of the app.
	mainWindow.loadUrl('file://' + __dirname + '/index.html');

	// Open the DevTools.
	//mainWindow.webContents.openDevTools();

	var webContents = mainWindow.webContents;
	webContents.on('did-finish-load', function () {
		argv.path = argv.path ? path.resolve(argv.path) : "";
		cfgHelper = new configHelper.DataSourceHelper('./cfg/config.json');
		var cfgObj = cfgHelper.getDataSource(argv.path).getConfigObj();
		console.log(cfgObj);
		webContents.send('paras', cfgObj);
	});
	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;

	});
});

var fs = require('fs');
var fse = require('fs-extra');
var mkdirp = require('mkdirp');
var mssql = require('mssql');
var _ = require('underscore');
var tmpl = require('./cfg/templates.json');
var sqlTypeDict = require('./cfg/sqlTypeDict.json');
var SqlServerDataSource = require('./data_source/sqlServerDataSource').default;
// var TemplateHelper = require('../templateHelper');


var genPath = "";

var sqlTypeDict_csharp = sqlTypeDict.csharp;

var sqlTypeDict_java = sqlTypeDict.java;

function initTmpl() {
	for (var item in tmpl) {
		if (tmpl.hasOwnProperty(item)) {
			console.log('[DEBUG]', '#initTmpl()', item, 'read template');
			tmpl[item].codeContent = fs.readFileSync('./tmpl/' + item + '.tmpl', { encoding: 'utf8' });
			console.log('[DEBUG]', '#initTmpl()', item, 'templating content');
			if (_.find(['viewAdd', 'viewDetail', 'viewIndex', 'viewEdit'], function (tmplName) {
				return tmplName === item;
			})) {
				tmpl[item].codeContentTmpl = _.template(tmpl[item].codeContent, { interpolate: /<\$=([\s\S]+?)\$>/g, evaluate: /<\$([\s\S]+?)\$>/g });
			} else {
				tmpl[item].codeContentTmpl = _.template(tmpl[item].codeContent);
			}
			console.log('[DEBUG]', '#initTmpl()', item, 'templating path');
			tmpl[item].pathNameTmpl = _.template(tmpl[item].pathName);
		}
	}
}

var count = -1;
var conn = {};
var entitiesGlobal=[];

ipc.on('devTool', function (event, arg) {
	mainWindow.webContents.openDevTools();
});

ipc.on('getEntities', function (event, arg) {
	if (Object.keys(arg)[0].length === 0) {
		event.sender.send('getEntities-reply', "fail");
	}
	console.log('mssql paras:', arg);
	var ds = new SqlServerDataSource(Object.keys(arg)[0], arg[Object.keys(arg)[0]]);
	cfgHelper.setDataSource(ds);

	ds.getEntities().then(function (entities) {
		entitiesGlobal=entities;
		console.log("entitiesGlobal:",entities[0].properties);
		event.sender.send('getEntities-reply', entities.map(function (entity) {
			return entity.getJSONObject();
		}));
	});
});


ipc.on('selectedList', function (event, entityNameList, genPath, nameSpace) {
	count = Object.keys(tmpl).length;
	console.log("path", genPath);
	//获取用户选择的Entity[]
	var entities = TemplateHelper.getEntitiesByNameList(entitiesGlobal,entityNameList);

	// //获取所有模板
	// var tmplList = tmpl
	//匹配所有模板路径
	var tmplObjAbs = TemplateHelper.setAbsolutePath(tmpl);

	entities.forEach(function (entity) {
		//根据Entity是否主从，获取相应的template
		var tmplObjAbsFilt = TemplateHelper.getTemplatesByEntity(tmplObjAbs, entity);
		
		//套用模板（重新构造Entity），生成文件到对应路径
		for(var i in tmplObjAbsFilt){
			var tmplContent = fs.readFileSync('./tmpl/' + i + '.tmpl', { encoding: 'utf8' });
			var extensionName = tmplObjAbsFilt[i].fileName.slice(tmplObjAbsFilt[i].fileName.lastIndexOf('.'))
			var codeContent = TemplateHelper.applyTemplate(tmplContent, entity, extensionName,nameSpace);
			
		}
		// subTmplList.forEach(function (tmpl) {
		// 	TemplateHelper.applyTemplate(tmpl, entity)
		// 		.then(function(fileContent, path) {
		// 			fs.writeFile(path, fileContent, function (err) {
		// 				// 处理可能的写入失败
		// 				// 结束
		// 			});
		// 		});
		// });
	});


	initTmpl();
	for (var item in tmpl) {
		if (tmpl.hasOwnProperty(item)) {
			var pathName = tmpl[item].pathName;
			console.log("pathName", pathName);
			//match
			match(genPath, pathName, item, event, selected);
		}
	}
});

function match(genPath, pathName, item, event, selected) {
	glob(pathName, { cwd: genPath }, function (er, files) {
		if (files.length === 0) {
			event.sender.send('selectedList-reply-error', "Template:" + item + ",路径不存在");
			return;
		}
		tmpl[item].path = path.join(genPath, files[0]);
		walkEnd(event, selected);
	});
}

function walkEnd(event, selected) {
	count -= 1;
	if (count === 0) {
		getPrimaryKeys(selected)
			.then(getColumns)
			.then(writeFiles)
		//.catch(logError)
			.then(function (tables) {
				console.log('OK');
				event.sender.send('selectedList-reply', JSON.stringify(tables));
			}, function (err) {
				console.log(err);
				event.sender.send('selectedList-reply', err.stack);
			});
	}
}

function getTables() {
	console.log("get table");
	return new Promise(function (resolve) {
		console.log('conn');
		var req = conn.request();
		req.query('sp_tables').then(function (recordset) {
			console.log('sp_tables');
			console.log('recordset', recordset.length);
			recordset = _.filter(recordset, function (item) {
				return item.TABLE_OWNER === 'dbo' && item.TABLE_TYPE === 'TABLE';
			}).map(function (item) {
				return {
					entityName: item.TABLE_NAME,
					entityNameDesc: '',
					PK: ''
				};
			});
			console.log('table count', recordset.length);
			resolve(recordset);
		}).catch(logError);
	});
}

function logError(err) {
	console.error(err.stack);
}


function getPrimaryKeys(tables) {
	// return new Promise(function (resolve) {
	return Promise.all(tables.map(function (item) {
		console.log('#getPKs: ');
		return getPrimaryKey(item);
	}));
	//   .then(function (_tables) {
	//     resolve(_tables);
	//   });
	// });
}

function getPrimaryKey(table) {

	return new Promise(function (resolve) {
		var req = conn.request();
		req.query('sp_pkeys ' + table.entityName).then(function (recordset) {
			if (recordset && recordset.length) {
				table.PK = recordset[0].COLUMN_NAME;
			} else {
				table.PK = '';
			}
			resolve(table);
		}).catch(logError);
	});
}

function getColumn(table) {
	return new Promise(function (resolve) {
		var req = conn.request();
		var sqlStr = [
			'SELECT ',
			'   tb.name AS TableName,',
			'   col.name AS ColumnName,',
			'   colInfo.DATA_TYPE AS ColDataType,',
			'   CASE(colInfo.IS_NULLABLE) WHEN \'YES\' THEN 1 ELSE 0 END AS ColIsNullable,',
			'   colInfo.CHARACTER_MAXIMUM_LENGTH AS ColMaxLength,',
			'   colInfo.NUMERIC_PRECISION AS ColPrecision,',
			'   colInfo.NUMERIC_SCALE AS ColScale,',
			'   cast(isnull(prop.value, \'\') as  nvarchar(100)) AS ColDescription',
			'   FROM sys.tables tb',
			'   LEFT JOIN sys.columns col ON col.OBJECT_ID = tb.OBJECT_ID',
			'   LEFT JOIN sys.extended_properties prop ON  prop.major_id = tb.OBJECT_ID AND prop.minor_id = col.column_id AND prop.name = \'MS_Description\' ',
			'   LEFT JOIN INFORMATION_SCHEMA.COLUMNS colInfo ON colInfo.COLUMN_NAME = col.name AND colInfo.TABLE_NAME = tb.name',
			'   WHERE tb.name = \'',
			table.entityName,
			'\''
		].join('');
		req.query(sqlStr).then(function (recordset) {
			table.columns = _.map(recordset, function (record) {
				var newRecord = {
					sqlType: record.ColDataType,
					javaType: parseJavaType(record.ColDataType),
					name: record.ColumnName,
					lowerCaseName: lowerFirstCharacter(record.ColumnName),
					desc: record.ColDescription,
					entityName: record.TableName,
					nullable: parseToBoolStr(record.ColIsNullable),
					length: parseInt(record.ColMaxLength) > 4000 ? 4000 : record.ColMaxLength,
					precision: record.ColPrecision,
					scale: record.ColScale,
				};
				//console.log('#newRecord: ', newRecord);
				return newRecord;
			});
			table.lowerCaseEntityName = lowerFirstCharacter(table.entityName);
			table.allLowerCaseEntityName = table.entityName.toLowerCase();

			resolve(table);
		}).catch(logError);
	});
}

function lowerFirstCharacter(x) {
	return x.substring(0, 1).toLowerCase() + x.substring(1);
}
function parseToBoolStr(x) {
	if (x.toString() == "0") {
		return 'false';
	} else {
		return 'true';
	}
}

function getColumns(tables) {
	return Promise.all(tables.map(function (item) {
		return getColumn(item);
	}));
}

function writeFile(table, genType) {

	var pathName = genType.path;

	console.log('#writeFile()', pathName);

	if (!fs.existsSync(pathName)) {
		mkdirp.sync(pathName);
	}

	table.nameSpace = nameSpaceStr;
	var fileName = _.template(genType.fileName)(table);
	var filePath = path.join(pathName, fileName);
	return new Promise(function (resolve, reject) {
		if (fs.existsSync(filePath)) {
			table.GenErrorInfo = 'file existed: ' + filePath;
			console.log('#writeFile().file existed', filePath, table.entityName);
			resolve(table);
		} else {
			// console.log('#writeFile(): ', table);
			fs.writeFile(filePath, genType.codeContentTmpl(table), { encoding: 'utf8' }, function (err) {
				if (err) {
					reject(err);
				} else {
					resolve(table);
				}
			});
		}
	});
}

function writeFiles(tables) {

	var tmplArr = [];
	for (var key in tmpl) {
		if (tmpl.hasOwnProperty(key)) {
			tmplArr.push(tmpl[key]);
		}
	}

	console.log('#writeFiles(): ');

	return Promise.all(tables.map(function (table) {
		return Promise.all(tmplArr.map(function (genType) {
			return writeFile(table, genType);
		}));
	}));
}
