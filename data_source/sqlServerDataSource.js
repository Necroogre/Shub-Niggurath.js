var entity_1 = require('../model/entity');
var property_1 = require('../model/property');
var mssql = require('mssql');
var _ = require('underscore');
var SqlServerDataSource = (function () {
    /**
     * @constructor
     * @param  {string} projPath 数据源对应的项目绝对路径
     * @param  {any} cfgObj 数据源配置 { server, database, user, password}
     */
    function SqlServerDataSource(projPath, cfgObj) {
        this.queryTableColumnsStr = "\nSELECT\n    tb.name AS TableName,\n    col.name AS ColumnName,\n    colInfo.DATA_TYPE AS ColDataType,\n    CASE (colInfo.IS_NULLABLE)\n        WHEN 'YES' THEN 1\n        ELSE 0\n    END AS ColIsNullable,\n    colInfo.CHARACTER_MAXIMUM_LENGTH AS ColMaxLength,\n    colInfo.NUMERIC_PRECISION AS ColPrecision,\n    colInfo.NUMERIC_SCALE AS ColScale,\n    CAST(ISNULL(prop.value, '') AS NVARCHAR(100)) AS ColDescription,\n    --pCol.constraint_object_id AS fkId,\n    --refCol.constraint_object_id AS refId,\n    --fk.name AS FKName,\n    --pTable.name AS ParentTableName,\n    refTable.name AS RefTableName,\n    --pColName.name as ParentColName,\n    refColName.name as RefColumnName,\n\tCASE constraintsCol.COLUMN_NAME WHEN col.name THEN 1 ELSE 0 END as isPK\n    --isnull(pTable.name, refTable.name) as FKTableName,\n    --isnull(pColName.name, refColName.name) as FKColumnName\nFROM sys.tables tb\nLEFT JOIN sys.columns col\n    ON col.OBJECT_ID = tb.OBJECT_ID\nLEFT JOIN sys.extended_properties prop\n    ON prop.major_id = tb.OBJECT_ID\n    AND prop.minor_id = col.column_id\n    AND prop.name = 'MS_Description'\nLEFT JOIN INFORMATION_SCHEMA.COLUMNS colInfo\n    ON colInfo.COLUMN_NAME = col.name\n    AND colInfo.TABLE_NAME = tb.name\nLEFT JOIN sys.foreign_key_columns pCol\n    ON pCol.parent_object_id = tb.object_id\n    AND pCol.parent_column_id = col.column_id\nLEFT JOIN sys.foreign_key_columns refCol\n    ON refCol.referenced_object_id = tb.object_id\n    AND refCol.referenced_column_id = col.column_id\nLEFT JOIN sys.foreign_keys fk\n    ON fk.object_id = refCol.constraint_object_id\nLEFT JOIN sys.tables pTable ON pTable.object_id = pCol.referenced_object_id\nLEFT JOIN sys.tables refTable ON refTable.object_id = refCol.parent_object_id\nLEFT JOIN sys.columns pColName ON pCol.referenced_column_id = pColName.column_id AND pColName.object_id = pTable.object_id\nLEFT JOIN sys.columns refColName ON refCol.parent_column_id = refColName.column_id AND refColName.object_id = refTable.object_id\nLEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS constraints ON constraints.TABLE_NAME = tb.name\nLEFT JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE constraintsCol ON constraintsCol.TABLE_NAME = tb.name AND constraintsCol.CONSTRAINT_NAME = constraints.CONSTRAINT_NAME and constraintsCol.COLUMN_NAME = col.name";
        //console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, obj);
        this.sqlCfg = {};
        this.projectPath = this.sqlCfg.projectPath = projPath;
        this.server = this.server = this.sqlCfg.server = cfgObj.server;
        this.database = this.sqlCfg.database = cfgObj.database;
        this.user = this.sqlCfg.user = cfgObj.user;
        this.password = this.sqlCfg.password = cfgObj.password;
        
    }
    /**
     * 获取数据源配置对象
     * @returns - projectPath, server, database, user, password
     */
    SqlServerDataSource.prototype.getConfigObj = function () {
        return {
            projectPath: this.projectPath,
            server: this.server,
            database: this.database,
            user: this.user,
            password: this.password
        };
    };
    SqlServerDataSource.prototype.ParseRecordToProperty = function (record) {
        var prop;
        prop = new property_1.default();
        prop.name = record['ColumnName'];
        prop.dataType = record['ColDataType'];
        prop.description = record['ColDescription'];
        prop.entityName = record['TableName'];
        prop.length = record['ColMaxLength'] || 0;
        prop.nullable = (record['ColIsNullable'] !== 0);
        prop.precision = record['ColPrecision'] || 0;
        prop.refEntityName = record['RefTableName'];
        prop.refPropertyName = record['RefColumnName'];
        prop.scale = record['ColScale'] || 0;
        prop.isPrimaryKey = (record['isPK'] !== 0);
        return prop;
    };
    SqlServerDataSource.prototype.excuteEntitiesQuery = function () {
        var req = new mssql.Request(this.sqlConn);
        req.query(this.queryTableColumnsStr).then(function (recordSet) {
            var properties = recordSet.map(this.ParseRecordToProperty);
        });
    };
    SqlServerDataSource.prototype.resolveEntityRelations = function (entities) {
        entities.forEach(function (entity) {
            entity.references = [];
            entity.properties.forEach(function (prop) {
                var refEntity = _.findWhere(entities, { name: prop.refEntityName });
                if (refEntity) {
                    prop.refEntity = refEntity;
                    entity.references.push({
                        propertyName: prop.name,
                        refPropertyName: prop.refPropertyName,
                        refEntity: refEntity
                    });
                }
            });
        });
        return entities;
    };
    /**
     * 获取所有实体定义
     * @returns Promise<Entity[]>
     */
    SqlServerDataSource.prototype.getEntities = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            mssql.connect(_this.sqlCfg).then(function () {
                //console.log('[DEBUG] #sqlServerDataSource.getEntities(), this.sqlCfg: ', this.sqlCfg);
                var req = new mssql.Request();
                req.query(_this.queryTableColumnsStr).then(function (recordSet) {
                    console.log('[DEBUG] #sqlServerDataSource.getEntities(), query result: ', recordSet.length);
                    var properties = recordSet.map(_this.ParseRecordToProperty);
                    var propGroup = _.groupBy(properties, function (prop) {
                        return prop.entityName;
                    });
                    var entities = [];
                    for (var key in propGroup) {
                        var entity = new entity_1.default(key, propGroup[key]);
                        entities.push(entity);
                    }
                    entities = _this.resolveEntityRelations(entities);
                    resolve(entities);
                }).catch(function (err) {
                    console.log('[ERROR] #sqlServerDataSource.getEntities(), ERROR: ', err);
                    resolve([]);
                });
            }).catch(function (err) {
                console.log('[ERROR] #sqlServerDataSource.getEntities(), ERROR: ', err);
                resolve([]);
            });
        });
    };
    return SqlServerDataSource;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SqlServerDataSource;
//# sourceMappingURL=sqlserverDataSource.js.map