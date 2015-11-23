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
exports.default = JSONDataSource;
//# sourceMappingURL=jsonDataSource.js.map