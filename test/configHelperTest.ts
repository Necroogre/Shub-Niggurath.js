import * as fs from 'fs';
import * as assert from 'assert';

import * as _ from 'underscore';

import * as config from '../cfg';
import SqlServerDataSource from '../data_source/sqlServerDataSource';

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
				database: 'ehsure.adrp-clean',
				nameSpace: 'com.ehsure.test'
			});
			//console.log('[DEBUG] Test.DataSourceHelper.#setDataSource, ds: ', ds.getConfigObj());
			cfgHelper.setDataSource(ds);
			var ds2 = <SqlServerDataSource>cfgHelper.getDataSource('./newOne');
			assert.equal(ds2.user, 'sa');
			assert.equal(ds2.nameSpace, 'com.ehsure.test');

			var ds3 = new SqlServerDataSource('./newOne', {
				user: 'sa1',
				password: '123qwe!@#',
				server: '192.168.2.255',
				database: 'ehsure.adrp-clean',
				nameSpace: 'com.ehsure.test2'
			});
			
			cfgHelper.setDataSource(ds3);
			var ds4 = <SqlServerDataSource>cfgHelper.getDataSource('./newOne');
			assert.equal(ds4.user, 'sa1');
			assert.equal(ds4.nameSpace, 'com.ehsure.test2');
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
				//console.log('[DEBUG] #configHelperTest.getEntities(), ds return: ', entities.length);
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