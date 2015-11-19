var config = require('./cfg');

var c = new config.DataSourceConfig('./cfg/config.json');

console.log(c);

console.log(c.getConfig('D:\\Projects\\Java\\ebd'));

