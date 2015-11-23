import IDataSource from './dataSource';
import Entity from '../model/entity';

export default class JSONDataSource implements IDataSource {
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

