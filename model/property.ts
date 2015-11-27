export default class Property {
	entityName: string;
	name: string;
	dataType: string;
	length: number;
	scale: number;
	precision: number;
	description: string;
	nullable: boolean;
	refEntityName: string;
	refPropertyName: string;
	isPrimaryKey: boolean;
	refParentEntityName: string;
	refParentPropertyName: string;
}