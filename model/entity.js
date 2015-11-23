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
    return Entity;
})();
exports.default = Entity;
//# sourceMappingURL=entity.js.map