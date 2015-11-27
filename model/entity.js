var Entity = (function () {
    function Entity(name, properties) {
        var _this = this;
        this.name = name;
        this.properties = [];
        properties.forEach(function (prop) {
            if (!_this.properties.find(function (existed) {
                return existed.name === prop.name;
            })) {
                _this.properties.push(prop);
            }
        });
        this.properties.forEach(function (prop) {
            if (prop.isPrimaryKey) {
                _this.primaryKey = prop;
            }
        });
    }
    Entity.prototype.getJSONObject = function () {
        return {
            name: this.name,
            primaryKey: this.primaryKey,
            properties: this.properties,
            references: this.references.map(function (ref) {
                return {
                    propertyName: ref.propertyName,
                    refPropertyName: ref.refPropertyName,
                    refEntityName: ref.refEntity.name
                };
            })
        };
    };
    return Entity;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Entity;
//# sourceMappingURL=entity.js.map