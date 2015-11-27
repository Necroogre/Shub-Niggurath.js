var fs = require('fs');
var _ = require('underscore');
var sqlserverDataSource_1 = require('./data_source/sqlserverDataSource');
var DataSourceHelper = (function () {
    function DataSourceHelper(cfgFilePath) {
        var cfgContent = fs.readFileSync(cfgFilePath, 'utf8');
        this.dataSources = JSON.parse(cfgContent);
        this.cfgFilePath = cfgFilePath;
    }
    DataSourceHelper.prototype.getDataSource = function (projectPath) {
        //console.log('[DEBUG] #DataSourceHelper.getConfig()', projectPath);
        var d = {};
        for (var key in this.dataSources) {
            if (this.dataSources[key].projectPath === projectPath) {
                //console.log('[DEBUG] #DataSourceHelper.getDataSource(), found [key]: ', key, this.dataSources[key]);
                d = this.dataSourceFactory(projectPath, this.dataSources[key]);
                break;
            }
        }
        if (!d.projectPath) {
            //console.log('[DEBUG] #DataSourceHelper.getDataSource(), not found [key]: ', projectPath);
            d = this.dataSourceFactory(projectPath, this.dataSources[0]);
        }
        //console.log('[DEBUG] #DataSourceHelper.getDataSource() result', projectPath, d);
        return d;
    };
    DataSourceHelper.prototype.setDataSource = function (config) {
        var existed = _.find(this.dataSources, function (x) { return x.projectPath === config.projectPath; });
        if (existed) {
            existed = config.getConfigObj();
        }
        else {
            this.dataSources.push(config.getConfigObj());
        }
        //console.log('[DEBUG] #DataSourceHelper.setDataSource():', config.getConfigObj(), this.cfgFilePath);
        fs.writeFileSync(this.cfgFilePath, JSON.stringify(this.dataSources), { encoding: 'utf8' });
    };
    DataSourceHelper.prototype.dataSourceFactory = function (projPath, configObj) {
        var d = {};
        switch (configObj.type) {
            case 'sqlserver':
                {
                    d = new sqlserverDataSource_1.default(projPath, configObj);
                }
                break;
            default:
                d = new sqlserverDataSource_1.default(projPath, configObj);
                break;
        }
        return d;
    };
    return DataSourceHelper;
})();
exports.DataSourceHelper = DataSourceHelper;
//# sourceMappingURL=cfg.js.map