var mkdirp = require('mkdirp');
var assert = require('assert');
var TemplateHelper = require('../templateHelper');
var templateObj = require('../cfg/templates.json');
var path = require('path');
var _ = require('underscore');


describe('TemplateHelper', function () {

  describe('#setAbsolutePath()', function () {
    it('should return templateObj', function () {
      // mkdirp.sync('./jsTest/entity');
      // mkdirp.sync('./jsTest/dto');
      // mkdirp.sync('./jsTest/repository/impl');
      // mkdirp.sync('./jsTest/repository');
      // mkdirp.sync('./jsTest/appservice/impl');
      // mkdirp.sync('./jsTest/appservice');
      // mkdirp.sync('./jsTest/controller');
      mkdirp.sync('./jsTest/api');
      // mkdirp.sync('./jsTest/WEB-INF/views');
      var entityAbsPath = path.resolve('./jsTest/api');
      var res = TemplateHelper.setAbsolutePath(templateObj, "./jsTest");
      //console.log("the return templateObj", res);
      console.log(res);
      assert.equal(res["api"].pathName, entityAbsPath);

    });
  });

  describe('#getTemplatesByEntity()', function () {
    it('should return templateObj', function () {
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
    it('should return templateObj', function () {
      var entity = {};
      entity.name = "ConfigHeader";
      entity.references = [];

      var fkEntity = {};
      fkEntity.name = "Header";
      fkEntity.references = [{ propertyName: "Id", refEntityName: "Detail", refPropertyName: "HeaderId" }];

      var entities=[fkEntity,entity];
      var nameList=[{entityName:"ConfigHeader",hasFK:false}];
      var res = TemplateHelper.getEntitiesByNameList(entities, nameList);
      
      assert.equal(res.length, 1);
      assert.equal(res[0].name, "ConfigHeader");
     
    });
  });
  
  
});