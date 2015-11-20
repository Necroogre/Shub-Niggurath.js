import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'underscore';

export class DataSourceHelper {

	private dataSources: any[];
	private cfgFilePath: string;

	constructor(cfgFilePath: string) {
		var cfgContent = fs.readFileSync(cfgFilePath, 'utf8');
		
		this.dataSources = JSON.parse(cfgContent);
		this.cfgFilePath = cfgFilePath;
	}

	getDataSource(projectPath: string): IDataSource {
		console.log('[DEBUG] #DataSourceHelper.getConfig()', projectPath);
		var d = <IDataSource>{};
		for (var key in this.dataSources) {
			if (this.dataSources[key].projectPath === projectPath) {
				console.log('[DEBUG] #DataSourceHelper.getDataSource(), found [key]: ', key, this.dataSources[key]);
				d = this.dataSourceFactory(projectPath, this.dataSources[key]);
				break;
			}
		}

		if (!d.projectPath) {
			console.log('[DEBUG] #DataSourceHelper.getDataSource(), not found [key]: ', projectPath);
			d = this.dataSourceFactory(projectPath, {})
		}
		console.log('[DEBUG] #DataSourceHelper.getDataSource() result', projectPath, d);

		return d;
	}

	setDataSource(config: IDataSource): void {
		var existed = _.find(this.dataSources, x=> x.projectPath === config.projectPath);
		if (existed) {
			existed = config;
		} else {
			this.dataSources.push(config);
		}
		console.log('[DEBUG] #DataSourceHelper.setDataSource():', config, this.cfgFilePath);
		fs.writeFileSync(this.cfgFilePath, JSON.stringify(this.dataSources), { encoding: 'utf8' });
	}

	private dataSourceFactory(projPath: string, configObj: any): IDataSource {
		var d = <IDataSource>{};
		switch (configObj.type) {
			case 'sqlserver': {
				d = new SqlServerDataSource(projPath, configObj);
			}
				break;
			default:
				d = new SqlServerDataSource(projPath, configObj);
				break;
		}
		return d;
	}
}

/**
 * 数据源，提供获取实体定义(@see {@link Entity})的方法
 */
interface IDataSource {
	projectPath: string;
	getEntities(): Promise<Entity[]>;
}

export class SqlServerDataSource implements IDataSource {
	projectPath: string;
	server: string;
	database: string;
	user: string;
	password: string;

	constructor(projPath: string, obj: any) {
		console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, obj);
		this.projectPath = projPath;
		this.server = obj.server;
		this.database = obj.database;
		this.user = obj.user;
		this.password = obj.password;
		console.log('[DEBUG] #SqlServerDataSource.constructor()', projPath, this);
	}

	getEntities(): Promise<Entity[]> {
		return new Promise<Entity[]>((resolve, reject) => {
			resolve([]);
		});
	}
}

export class JSONDataSource implements IDataSource {
	projectPath: string;

	constructor(projPath: string) {
		this.projectPath = projPath;
	}

	getEntities(): Promise<Entity[]> {
		return new Promise<Entity[]>((resolve, reject) => {
			resolve([]);
		});
	}
}

class Entity {
	name: string;
	primaryKey: Property;
	properties: Property[];
}

class Property {
	entityName: string;
	name: string;
	dataType: string;
	length: number;
	scale: number;
	precision: number;
	description: string;
	nullable: boolean;
	RefEntityName: string;
	RefPropertyName: string;
}

//export = Config;