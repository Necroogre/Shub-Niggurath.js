import * as fs from 'fs';
import * as assert from 'assert';

import * as config from '../cfg';

describe('DataSourceHelper', () => {
	var cfgHelper: config.DataSourceHelper;

	beforeEach(() => {
		if (fs.existsSync('./testConfig.json')) {
			fs.unlinkSync('./testConfig.json');
		}
		fs.writeFileSync('./testConfig.json', JSON.stringify([{ projectPath: './testDir', user: 'username' }]));

		cfgHelper = new config.DataSourceHelper('./testConfig.json');
	});

	describe('#getDataSource', () => {
		it('should return the prepared datasource', () => {
			var c = <config.SqlServerDataSource>cfgHelper.getDataSource('./testDir');
			assert.equal(c.projectPath, './testDir');
			console.log('[DEBUG] configHelperTest.#hello.#getConfig:', c);
			assert.equal(c.user, 'username');
		});
	});

	describe('#setDataSource', () => {
		it('should return the newly set config obj', () => {
			var ds = new config.SqlServerDataSource('./newOne', { user: 'user2' });
			cfgHelper.setDataSource(ds);
			var ds2 = <config.SqlServerDataSource> cfgHelper.getDataSource('./newOne');
			assert.equal(ds2.user, 'user2');
		});
	});
	
	describe('#getEntities', () => {
		it('should return the selected entity obj', () => {
			//var ds
		});
	});
});