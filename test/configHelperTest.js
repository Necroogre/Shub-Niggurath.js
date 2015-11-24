var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');
var config = require('../cfg');
var sqlserverDataSource_1 = require('../data_source/sqlserverDataSource');
describe('DataSourceHelper', function () {
    var cfgHelper;
    beforeEach(function () {
        if (fs.existsSync('./testConfig.json')) {
            fs.unlinkSync('./testConfig.json');
        }
        fs.writeFileSync('./testConfig.json', JSON.stringify([{ projectPath: './testDir', user: 'username' }]));
        cfgHelper = new config.DataSourceHelper('./testConfig.json');
    });
    describe('#getDataSource', function () {
        it('should return the prepared datasource', function () {
            var c = cfgHelper.getDataSource('./testDir');
            assert.equal(c.projectPath, './testDir');
            //console.log('[DEBUG] configHelperTest.#hello.#getConfig:', c);
            assert.equal(c.user, 'username');
        });
    });
    describe('#setDataSource', function () {
        it('should return the newly set config obj', function () {
            var ds = new sqlserverDataSource_1.default('./newOne', {
                user: 'sa',
                password: '123qwe!@#',
                server: '192.168.2.254',
                database: 'ehsure.adrp-clean'
            });
            cfgHelper.setDataSource(ds);
            var ds2 = cfgHelper.getDataSource('./newOne');
            assert.equal(ds2.user, 'sa');
        });
    });
    describe('#getEntities', function () {
        it('should return the selected entity obj', function (done) {
            this.timeout(5000);
            var ds = new sqlserverDataSource_1.default('./newOne', {
                user: 'sa',
                password: '123qwe!@#',
                server: '192.168.2.254',
                database: 'ehsure.adrp-clean'
            });
            ds.getEntities().then(function (entities) {
                console.log('[DEBUG] #configHelperTest.getEntities(), ds return: ', entities.length);
                var headerEntity = _.find(entities, function (e) {
                    return e.name === 'Header';
                });
                assert.equal('Id', headerEntity.primaryKey.name);
                var refColumn = _.find(headerEntity.properties, function (prop) {
                    return prop.refEntityName !== null;
                });
                assert.equal('Detail', refColumn.refEntityName);
                assert.equal('HeaderId', refColumn.refPropertyName);
                assert.equal(headerEntity.references[0].propertyName, "Id");
                assert.equal(headerEntity.references[0].refPropertyName, "HeaderId");
                assert.equal(headerEntity.references[0].refEntity.name, "Detail");
                done();
            }).catch(done);
        });
    });
});
//# sourceMappingURL=configHelperTest.js.map