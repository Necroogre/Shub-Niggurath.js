var JSONDataSource = (function () {
    function JSONDataSource(projPath) {
        this.projectPath = projPath;
    }
    JSONDataSource.prototype.getEntities = function () {
        return new Promise(function (resolve, reject) {
            resolve([]);
        });
    };
    return JSONDataSource;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = JSONDataSource;
//# sourceMappingURL=jsonDataSource.js.map