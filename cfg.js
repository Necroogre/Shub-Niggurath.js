var fs = require('fs');
var _ = require('underscore');
var DataSourceHelper = (function () {
    function DataSourceHelper(cfgFilePath) {
        var cfgContent = fs.readFileSync(cfgFilePath, 'utf8');
        this.dataSources = JSON.parse(cfgContent);
        this.cfgFilePath = cfgFilePath;
    }
    DataSourceHelper.prototype.getDataSource = function (projectPath) {
        console.log('[DEBUG] #DataSourceHelper.getConfig()', projectPath);
        var d = {};
        for (var key in this.dataSources) {
            if (this.dataSources[key].projectPath === projectPath) {
                console.log('[DEBUG] #DataSourceHelper.getDataSource(), found [key]: ', key, this.dataSources[key]);
                d = this.dataSourceFactory(projectPath, this.dataSources[key]);
                break;
            }
        }
        if (!d.projectPath) {
            console.log('[DEBUG] #DataSourceHelper.getDataSource(), not found [key]: ', projectPath);
            d = this.dataSourceFactory(projectPath, {});
        }
        console.log('[DEBUG] #DataSourceHelper.getDataSource() result', projectPath, d);
        return d;
    };
    DataSourceHelper.prototype.setDataSource = function (config) {
        var existed = _.find(this.dataSources, function (x) { return x.projectPath === config.projectPath; });
        if (existed) {
            existed = config;
        }
        else {
            this.dataSources.push(config);
        }
        console.log('[DEBUG] #DataSourceHelper.setDataSource():', config, this.cfgFilePath);
        fs.writeFileSync(this.cfgFilePath, JSON.stringify(this.dataSources), { encoding: 'utf8' });
    };
    DataSourceHelper.prototype.dataSourceFactory = function (projPath, configObj) {
        var d = {};
        switch (configObj.type) {
            case 'sqlserver':
                {
                    d = new SqlServerDataSource(projPath, configObj);
                }
                break;
            default:
                d = new SqlServerDataSource(projPath, configObj);
                break;
        }
        return d;
    };
    return DataSourceHelper;
})();
exports.DataSourceHelper = DataSourceHelper;
var SqlServerDataSource = (function () {
    function SqlServerDataSource(projPath, obj) {
        console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, obj);
        this.projectPath = projPath;
        this.server = obj.server;
        this.database = obj.database;
        this.user = obj.user;
        this.password = obj.password;
        console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, this);
    }
    SqlServerDataSource.prototype.getEntities = function () {
        return new Promise(function (resolve, reject) {
            resolve([]);
        });
    };
    return SqlServerDataSource;
})();
exports.SqlServerDataSource = SqlServerDataSource;
var JSONDataSource = (function () {
    function JSONDataSource(projPath) {
        this.projectPath = projPath;
    }
    JSONDataSource.prototype.getEntities = function () {
        return new Promise(function (resolve, reject) {
            resolve([]);
        });
    };
    return JSONDataSource;
})();
exports.JSONDataSource = JSONDataSource;
var Entity = (function () {
    function Entity() {
    }
    return Entity;
})();
var Property = (function () {
    function Property() {
    }
    return Property;
})();
//export = Config; 
//# sourceMappingURL=cfg.js.map