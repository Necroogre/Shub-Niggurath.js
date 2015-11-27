///<reference path="../typings/es6-promise/es6-promise" />
import IDataSource from './dataSource';
import Entity from '../model/entity';
import Property from '../model/property';

import * as mssql from 'mssql';
import * as _ from 'underscore';

export default class SqlServerDataSource implements IDataSource {
	projectPath: string;
	server: string;
	database: string;
	user: string;
	password: string;
	nameSpace: string;

	private sqlConn: mssql.Connection;
	private sqlCfg: any;
	
    /**
	 * @constructor
     * @param  {string} projPath 数据源对应的项目绝对路径
     * @param  {any} cfgObj 数据源配置 { server, database, user, password }
     */
	constructor(projPath: string, cfgObj: any) {
		//console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, cfgObj);
		this.sqlCfg = {};
		this.projectPath = this.sqlCfg.projectPath = projPath;
		this.server = this.server = this.sqlCfg.server = cfgObj.server;
		this.database = this.sqlCfg.database = cfgObj.database;
		this.user = this.sqlCfg.user = cfgObj.user;
		this.password = this.sqlCfg.password = cfgObj.password;
		this.nameSpace = this.sqlCfg.nameSpace = cfgObj.nameSpace;
	}
    /**
	 * 获取数据源配置对象
     * @returns - projectPath, server, database, user, password
     */
	getConfigObj(): any {
		return {
			projectPath: this.projectPath,
			server: this.server,
			database: this.database,
			user: this.user,
			password: this.password,
			nameSpace: this.nameSpace
		};
	}

	private ParseRecordToProperty(record: any): Property {
		var prop: Property;
		prop = new Property();
		prop.name = record['ColumnName'];
		prop.dataType = record['ColDataType'];
		prop.description = record['ColDescription'];
		prop.entityName = record['TableName'];
		prop.length = record['ColMaxLength'];
		prop.nullable = (record['ColIsNullable'] !== 0);
		prop.precision = record['ColPrecision'];
		prop.refEntityName = record['RefTableName'];
		prop.refPropertyName = record['RefColumnName'];
		prop.scale = record['ColScale'];
		prop.isPrimaryKey = (record['isPK'] !== 0);
		return prop;
	}

	private excuteEntitiesQuery(): Promise<Entity[]> {
		var req = new mssql.Request(this.sqlConn);
		req.query(this.queryTableColumnsStr).then(function(recordSet) {
			var properties: Property[] = recordSet.map(this.ParseRecordToProperty);
		});
	}

	private resolveEntityRelations(entities: Entity[]): Entity[] {
		entities.forEach((entity) => {
			entity.references = [];
			entity.properties.forEach((prop) => {
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
	}
	
    /**
	 * 获取所有实体定义
     * @returns Promise<Entity[]>
     */
	getEntities(): Promise<Entity[]> {
		return new Promise((resolve, reject) => {
			mssql.connect(this.sqlCfg).then(() => {
				//console.log('[DEBUG] #sqlServerDataSource.getEntities(), this.sqlCfg: ', this.sqlCfg);
				var req = new mssql.Request();
				req.query(this.queryTableColumnsStr).then((recordSet) => {
					//console.log('[DEBUG] #sqlServerDataSource.getEntities(), query result: ', recordSet.length);
					var properties: Property[] = recordSet.map(this.ParseRecordToProperty);
					var propGroup = _.groupBy(properties, (prop) => {
						return prop.entityName;
					});
					var entities: Entity[] = [];
					for (var key in propGroup) {
						var entity: Entity = new Entity(key, propGroup[key]);
						entities.push(entity);
					}
					entities = this.resolveEntityRelations(entities);
					resolve(entities);
				}).catch((err) => {
					console.log('[ERROR] #sqlServerDataSource.getEntities(), ERROR: ', err);
					resolve([]);
				});
			}).catch((err) => {
				console.log('[ERROR] #sqlServerDataSource.getEntities(), ERROR: ', err);
				resolve([]);
			});
		});
	}

	private queryTableColumnsStr = `
SELECT
    tb.name AS TableName,
    col.name AS ColumnName,
    colInfo.DATA_TYPE AS ColDataType,
    CASE (colInfo.IS_NULLABLE)
        WHEN 'YES' THEN 1
        ELSE 0
    END AS ColIsNullable,
    colInfo.CHARACTER_MAXIMUM_LENGTH AS ColMaxLength,
    colInfo.NUMERIC_PRECISION AS ColPrecision,
    colInfo.NUMERIC_SCALE AS ColScale,
    CAST(ISNULL(prop.value, '') AS NVARCHAR(100)) AS ColDescription,
    --pCol.constraint_object_id AS fkId,
    --refCol.constraint_object_id AS refId,
    --fk.name AS FKName,
    --pTable.name AS ParentTableName,
    refTable.name AS RefTableName,
    --pColName.name as ParentColName,
    refColName.name as RefColumnName,
	CASE constraintsCol.COLUMN_NAME WHEN col.name THEN 1 ELSE 0 END as isPK
    --isnull(pTable.name, refTable.name) as FKTableName,
    --isnull(pColName.name, refColName.name) as FKColumnName
FROM sys.tables tb
LEFT JOIN sys.columns col
    ON col.OBJECT_ID = tb.OBJECT_ID
LEFT JOIN sys.extended_properties prop
    ON prop.major_id = tb.OBJECT_ID
    AND prop.minor_id = col.column_id
    AND prop.name = 'MS_Description'
LEFT JOIN INFORMATION_SCHEMA.COLUMNS colInfo
    ON colInfo.COLUMN_NAME = col.name
    AND colInfo.TABLE_NAME = tb.name
LEFT JOIN sys.foreign_key_columns pCol
    ON pCol.parent_object_id = tb.object_id
    AND pCol.parent_column_id = col.column_id
LEFT JOIN sys.foreign_key_columns refCol
    ON refCol.referenced_object_id = tb.object_id
    AND refCol.referenced_column_id = col.column_id
LEFT JOIN sys.foreign_keys fk
    ON fk.object_id = refCol.constraint_object_id
LEFT JOIN sys.tables pTable ON pTable.object_id = pCol.referenced_object_id
LEFT JOIN sys.tables refTable ON refTable.object_id = refCol.parent_object_id
LEFT JOIN sys.columns pColName ON pCol.referenced_column_id = pColName.column_id AND pColName.object_id = pTable.object_id
LEFT JOIN sys.columns refColName ON refCol.parent_column_id = refColName.column_id AND refColName.object_id = refTable.object_id
LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS constraints ON constraints.TABLE_NAME = tb.name
LEFT JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE constraintsCol ON constraintsCol.TABLE_NAME = tb.name AND constraintsCol.CONSTRAINT_NAME = constraints.CONSTRAINT_NAME and constraintsCol.COLUMN_NAME = col.name`;
}