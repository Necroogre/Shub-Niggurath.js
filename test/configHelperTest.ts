import * as fs from 'fs';
import * as assert from 'assert';

import * as config from '../cfg';

describe('hello', () => {
	var cfg: config.DataSourceConfig;
	beforeEach(() => {
		if (!fs.existsSync('./testConfig.json')) {
			fs.writeFileSync('./testConfig.json', JSON.stringify([{ projectPath: './testDir' }]));
		}
		cfg = new config.DataSourceConfig('./testConfig.json');
	});

	describe('#getConfig', () => {
		it('should return the prepared datasource', () => {
			var c = cfg.getConfig('./testDir');
			
		})
	})
})