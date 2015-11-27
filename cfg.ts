import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'underscore';

import Entity from './model/entity';
import Property from './model/property';
import IDataSource from './data_source/dataSource';
import SqlServerDataSource from './data_source/sqlserverDataSource'

export class DataSourceHelper {

	private dataSources: IDataSource[];
	private cfgFilePath: string;

	constructor(cfgFilePath: string) {
		var cfgContent = fs.readFileSync(cfgFilePath, 'utf8');

		this.dataSources = JSON.parse(cfgContent);
		this.cfgFilePath = cfgFilePath;
	}

	getDataSource(projectPath: string): IDataSource {
		//console.log('[DEBUG] #DataSourceHelper.getConfig()', projectPath);
		var d = <IDataSource>{};
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
	}

	setDataSource(config: IDataSource): void {
		var existed = _.find(this.dataSources, x=> x.projectPath === config.projectPath);
		if (existed) {
			existed = config.getConfigObj();
		} else {
			this.dataSources.push(config.getConfigObj());
		}
		//console.log('[DEBUG] #DataSourceHelper.setDataSource():', config.getConfigObj(), this.cfgFilePath);
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