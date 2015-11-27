/* global it */
/* global describe */
/* jshint esnext:true */


var mkdirp = require('mkdirp');
var assert = require('assert');
var TemplateHelper = require('../templateHelper');
var templateObj = require('../cfg/templates.json');
var path = require('path');
var _ = require('underscore');


describe('TemplateHelper', function () {

  describe('#setAbsolutePath()', function () {
    it('should return templateObj with absolute path', function () {
      var templateObj = {
        "api": {
          "fileName": "<%= name %>.java",
          "pathName": "./**/api"
        }
      };
      mkdirp.sync('./jsTest/api');
      var entityAbsPath = path.resolve('./jsTest/api');
      var res = TemplateHelper.setAbsolutePath(templateObj, "./jsTest");
      assert.equal(res["api"].pathName, entityAbsPath);

    });
  });

  describe('#getTemplatesByEntity()', function () {
    it('should return different for simple entity and header-detail entity', function () {
      var entity = {};
      entity.name = "ConfigHeader";
      entity.references = [];

      var fkEntity = {};
      fkEntity.name = "Header";
      fkEntity.references = [{ propertyName: "Id", refEntityName: "Detail", refPropertyName: "HeaderId" }];

      var res = TemplateHelper.getTemplatesByEntity(templateObj, entity);
      var nameList = _.keys(res);
      assert.equal(!_.contains(nameList, "viewAddHeaderDetail"), true);

      var res1 = TemplateHelper.getTemplatesByEntity(templateObj, fkEntity);

      var nameList1 = _.keys(res1);
      assert.equal(!_.contains(nameList1, "viewAdd"), true);

    });
  });


  describe('#getEntitiesByNameList()', function () {
    it('should filter the entityList by given entities', function () {
      var entity = {};
      entity.name = "ConfigHeader";
      entity.references = [];

      var fkEntity = {};
      fkEntity.name = "Header";
      fkEntity.references = [{ propertyName: "Id", refEntityName: "Detail", refPropertyName: "HeaderId" }];

      var entities = [fkEntity, entity];
      var nameList = [{ entityName: "ConfigHeader", hasFK: false }];
      var res = TemplateHelper.getEntitiesByNameList(entities, nameList);

      assert.equal(res.length, 1);
      assert.equal(res[0].name, "ConfigHeader");

    });
  });

  describe('#applyTemplate()', function () {
    it('should return templated string', function () {
      var entity = {
        name: "TestEntity",
        properties: [
          { name: "Id", description: "this is id", dataType: "varchar", precision: 0, length: 0, scale: 0, nullable: true },
          { name: "Name", description: "this is name", dataType: "varchar", precision: 0, length: 0, scale: 0, nullable: true }
        ]
      };
      var extensionName = "java";
      var nameSpace = "com.ehsure.test";
      var tmplContent = "Hello, <%= entityName %>, your nameSpace is '<%= nameSpace %>' and you have <%= columns.length %> columns.";
      
      var templatedString = TemplateHelper.applyTemplate(tmplContent, entity, extensionName, nameSpace);
      assert.equal(templatedString, `Hello, ${entity.name}, your nameSpace is '${nameSpace}' and you have ${entity.properties.length} columns.`);
    });
  });


});