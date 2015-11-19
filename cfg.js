var fs = require('fs');
var _ = require('underscore');
var DataSourceConfig = (function () {
    function DataSourceConfig(cfgFilePath) {
        var cfgContent = fs.readFileSync(cfgFilePath, 'utf8');
        this.configurations = JSON.parse(cfgContent);
    }
    DataSourceConfig.prototype.getConfig = function (projectPath) {
        console.log('[DEBUG] #DataSourceConfig.getConfig()', projectPath);
        var d = {};
        for (var key in this.configurations) {
            if (key === projectPath) {
                console.log('[DEBUG] #DataSourceConfig.getConfig(), found [key]: ', key, this.configurations[key]);
                d = this.dataSourceFactory(key, this.configurations[key]);
                break;
            }
        }
        if (!d.projectPath) {
            console.log('[DEBUG] #DataSourceConfig.getConfig(), not found [key]: ', projectPath);
            d = this.dataSourceFactory(projectPath, {});
        }
        return d;
    };
    DataSourceConfig.prototype.setConfig = function (config) {
        var existed = _.find(this.configurations, function (x) { return x.projectPath === config.projectPath; });
        if (existed) {
            existed = config;
        }
        else {
            this.configurations.push(config);
        }
        fs.writeFileSync(this.cfgFilePath, JSON.stringify(this.configurations), { encoding: 'utf8' });
    };
    DataSourceConfig.prototype.dataSourceFactory = function (projPath, configObj) {
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
    return DataSourceConfig;
})();
exports.DataSourceConfig = DataSourceConfig;
var SqlServerDataSource = (function () {
    function SqlServerDataSource(projPath, obj) {
        console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, obj);
        this.projectPath = projPath;
        this.server = obj.server;
        this.database = obj.database;
        this.user = obj.user;
        this.password = obj.password;
    }
    SqlServerDataSource.prototype.getEntities = function () {
        return new Promise(function (resolve, reject) {
            resolve([]);
        });
    };
    return SqlServerDataSource;
})();
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
