import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'underscore';

export class DataSourceConfig {

	private configurations: any[];
	private cfgFilePath

	constructor(cfgFilePath: string) {
		var cfgContent = fs.readFileSync(cfgFilePath, 'utf8');
		this.configurations = JSON.parse(cfgContent);
	}

	getConfig(projectPath: string): IDataSource {
		console.log('[DEBUG] #DataSourceConfig.getConfig()', projectPath);
		var d = <IDataSource>{};
		for (var key in this.configurations) {
			if (key === projectPath) {
				console.log('[DEBUG] #DataSourceConfig.getConfig(), found [key]: ', key, this.configurations[key]);
				d = this.dataSourceFactory(key, this.configurations[key]);
				break;
			}
		}

		if (!d.projectPath) {
			console.log('[DEBUG] #DataSourceConfig.getConfig(), not found [key]: ', projectPath);
			d = this.dataSourceFactory(projectPath, {})
		}

		return d;
	}

	setConfig(config: IDataSource): void {
		var existed = _.find(this.configurations, x=> x.projectPath === config.projectPath);
		if (existed) {
			existed = config;
		} else {
			this.configurations.push(config);
		}

		fs.writeFileSync(this.cfgFilePath, JSON.stringify(this.configurations), { encoding: 'utf8' });
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

class SqlServerDataSource implements IDataSource {
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
	ReferenceEntity: any;
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
}

//export = Config;