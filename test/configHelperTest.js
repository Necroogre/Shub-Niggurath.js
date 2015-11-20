var fs = require('fs');
var assert = require('assert');
var config = require('../cfg');
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
            console.log('[DEBUG] configHelperTest.#hello.#getConfig:', c);
            assert.equal(c.user, 'username');
        });
    });
    describe('#setDataSource', function () {
        it('should return the newly set config obj', function () {
            var ds = new config.SqlServerDataSource('./newOne', { user: 'user2' });
            cfgHelper.setDataSource(ds);
            var ds2 = cfgHelper.getDataSource('./newOne');
            assert.equal(ds2.user, 'user2');
        });
    });
    describe('#getEntities', function () {
        it('should return the selected entity obj', function () {
            //var ds
        });
    });
});
//# sourceMappingURL=configHelperTest.js.map