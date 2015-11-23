import Property from './property';

export default class Entity {
	name: string;
	primaryKey: Property;
	properties: Property[];
	references: any[];

	constructor(name: string, properties: Property[]) {
		this.name = name;
		this.properties = properties;
		this.properties.forEach((prop) => {
			if(prop.isPrimaryKey) {
				this.primaryKey = prop;
			}
		});
	}
}