import * as fs from 'fs';
import * as assert from 'assert';

import * as _ from 'underscore';

import * as config from '../cfg';
import SqlServerDataSource from '../data_source/sqlserverDataSource';

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
			var c = <SqlServerDataSource>cfgHelper.getDataSource('./testDir');
			assert.equal(c.projectPath, './testDir');
			//console.log('[DEBUG] configHelperTest.#hello.#getConfig:', c);
			assert.equal(c.user, 'username');
		});
	});

	describe('#setDataSource', () => {
		it('should return the newly set config obj', () => {
			var ds = new SqlServerDataSource('./newOne', {
				user: 'sa',
				password: '123qwe!@#',
				server: '192.168.2.254',
				database: 'ehsure.adrp-clean'
			});
			cfgHelper.setDataSource(ds);
			var ds2 = <SqlServerDataSource>cfgHelper.getDataSource('./newOne');
			assert.equal(ds2.user, 'sa');
		});
	});

	describe('#getEntities', () => {
		it('should return the selected entity obj', function(done) {
			this.timeout(5000);
			var ds = new SqlServerDataSource('./newOne', {
				user: 'sa',
				password: '123qwe!@#',
				server: '192.168.2.254',
				database: 'ehsure.adrp-clean'
			});
			ds.getEntities().then(function(entities) {
				console.log('[DEBUG] #configHelperTest.getEntities(), ds return: ', entities.length);
				var headerEntity = _.find(entities, (e) => {
					return e.name === 'Header';
				});
				assert.equal('Id', headerEntity.primaryKey.name);

				var refColumn = _.find(headerEntity.properties, (prop) => {
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