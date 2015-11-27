var fs = require('fs');
var assert = require('assert');
var _ = require('underscore');
var config = require('../cfg');
var sqlServerDataSource_1 = require('../data_source/sqlServerDataSource');
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
            var ds = new sqlServerDataSource_1.default('./newOne', {
                user: 'sa',
                password: '123qwe!@#',
                server: '192.168.2.254',
                database: 'ehsure.adrp-clean',
                nameSpace: 'com.ehsure.test'
            });
            //console.log('[DEBUG] Test.DataSourceHelper.#setDataSource, ds: ', ds.getConfigObj());
            cfgHelper.setDataSource(ds);
            var ds2 = cfgHelper.getDataSource('./newOne');
            assert.equal(ds2.user, 'sa');
            assert.equal(ds2.nameSpace, 'com.ehsure.test');
        });
    });
    describe('#getEntities', function () {
        it('should return the selected entity obj', function (done) {
            this.timeout(5000);
            var ds = new sqlServerDataSource_1.default('./newOne', {
                user: 'sa',
                password: '123qwe!@#',
                server: '192.168.2.254',
                database: 'ehsure.adrp-clean'
            });
            ds.getEntities().then(function (entities) {
                //console.log('[DEBUG] #configHelperTest.getEntities(), ds return: ', entities.length);
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
                var detailEntity = _.findWhere(entities, { name: 'Detail' });
                assert.equal(detailEntity.primaryKey.name, 'Id');
                var refParentColumn = _.findWhere(detailEntity.properties, { name: 'HeaderId' });
                assert.equal(refParentColumn.refParentEntityName, 'Header');
                assert.equal(refParentColumn.refParentPropertyName, 'Id');
                done();
            }).catch(done);
        });
    });
});
//# sourceMappingURL=configHelperTest.js.map