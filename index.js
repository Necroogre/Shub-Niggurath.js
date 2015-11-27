/* global Promise */
/* jshint esnext:true */

var path = require('path');
var configHelper = require('./cfg');
//this main.js file is wrapped in 'app' directory.
//but the application is started from 'electron.exe'
//change cwd at the beginning to make all relative path work properly.
process.chdir(path.resolve(__dirname, './'));

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var ipc = require('ipc');
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
	if (process.platform !== 'darwin') {
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
var mkdirp = require('mkdirp');
var _ = require('underscore');
var tmpl = require('./cfg/templates.json');
var SqlServerDataSource = require('./data_source/sqlServerDataSource').default;
var TemplateHelper = require('./templateHelper');


var count = -1;
var entitiesGlobal = [];

ipc.on('devTool', function () {
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
		entitiesGlobal = entities;
		event.sender.send('getEntities-reply', entities.map(function (entity) {
			return entity.getJSONObject();
		}));
	});
});


ipc.on('selectedList', function (event, entityNameList, genPath, nameSpace) {
	count = Object.keys(tmpl).length;
	// console.log("path", genPath);
	// console.log("entityNameList", entityNameList);
	// console.log("entitiesGlobal.length", entitiesGlobal.length);
	
	var entities = TemplateHelper.getEntitiesByNameList(entitiesGlobal, entityNameList);

	TemplateHelper.setAbsolutePath(tmpl, genPath).then(function (tmplObjAbs) {
		writeAll(entities, tmplObjAbs, nameSpace).then(function (entities) {
			console.log('OK ');
			event.sender.send('selectedList-reply', JSON.stringify(entities));
		}, function (err) {
			console.log(err);
			event.sender.send('selectedList-reply', err.stack);
		});
	}).catch(function (err) {
		console.log(err);
		event.sender.send('selectedList-reply', err.stack);
	});
});

function writeAll(entities, tmplObjAbs, nameSpace) {
	return Promise.all(
		entities.map((entity) => {
			return writeOne(entity, tmplObjAbs, nameSpace);
		}));
}

function writeOne(entity, tmplObjAbs, nameSpace) {
	return new Promise(function (resolve, reject) {
		var tmplObjAbsFilt = TemplateHelper.getTemplatesByEntity(tmplObjAbs, entity);
		for (var i in tmplObjAbsFilt) {
			if (!tmplObjAbsFilt.hasOwnProperty(i)) {
				continue;
			}
			var tmplContent = fs.readFileSync('./tmpl/' + i + '.tmpl', { encoding: 'utf8' });
			var extensionName = tmplObjAbsFilt[i].fileName.slice(tmplObjAbsFilt[i].fileName.lastIndexOf('.') + 1);
			var codeContent = TemplateHelper.applyTemplate(tmplContent, entity, extensionName, nameSpace);
			console.log('[DEBUG] after applyTemplate()', entity.name, i);
			var fullPath = path.join(tmplObjAbsFilt[i].pathName, _.template(tmplObjAbsFilt[i].fileName)(entity));
			if (!fs.existsSync(path.dirname(fullPath))) {
				mkdirp.sync(path.dirname(fullPath));
			}
			if (fs.existsSync(fullPath)) {
				entity.GenErrorInfo = 'file existed: ' + fullPath;
				console.log('#writeFile().file existed', fullPath, entity.name);
				resolve(entity);
			} else {
				fs.writeFile(fullPath, codeContent, function (err) {
					if (err) {
						console.log('ipc.on("selectedList").fs.writeFile Error', err, 'fileName: ' + tmplObjAbsFilt[i].pathName);
						reject(err);
					} else {
						resolve(entity);
					}
				});
			}
		}
	});
}