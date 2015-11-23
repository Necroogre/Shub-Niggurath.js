import Entity from '../model/entity';

/**
 * 数据源，提供获取实体定义(@see {@link Entity})的方法
 */
interface IDataSource {
	projectPath: string;
	getEntities(): Promise<Entity[]>;
	getConfigObj(): Object;
}

export = IDataSource;