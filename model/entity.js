var Entity = (function () {
    function Entity(name, properties) {
        var _this = this;
        this.name = name;
        this.properties = properties;
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
exports.default = Entity;
//# sourceMappingURL=entity.js.map