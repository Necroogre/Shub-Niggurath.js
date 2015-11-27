import Property from './property';

export default class Entity {
	name: string;
	primaryKey: Property;
	properties: Property[];
	references: any[];

	constructor(name: string, properties: Property[]) {
		this.name = name;
		this.properties = [];
		properties.forEach((prop)=>{
			if(!this.properties.find((existed)=>{
				return existed.name === prop.name;
			})){
				this.properties.push(prop);
			}
		});
		
		this.properties.forEach((prop) => {
			if(prop.isPrimaryKey) {
				this.primaryKey = prop;
			}
		});
	}
	
	getJSONObject():any{
		return {
			name: this.name,
			primaryKey: this.primaryKey,
			properties: this.properties,
			references: this.references.map((ref)=>{
				return {
					propertyName: ref.propertyName,
					refPropertyName: ref.refPropertyName,
					refEntityName: ref.refEntity.name
				};
			})
		};
	}
}