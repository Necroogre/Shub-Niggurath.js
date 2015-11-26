var glob = require("glob");
var path = require('path');
var _ = require('underscore');
var sqlTypeDict = require('./cfg/sqlTypeDict.json');


var TemplateHelper = (function () {
    function TemplateHelper() {
    }
    //匹配所有模板绝对路径
    TemplateHelper.prototype.setAbsolutePath = function (tmplObj, rootPath) {
        for (var item in tmplObj) {
            var relativePath = tmplObj[item].pathName;
            // console.log("relateivePath",relateivePath);
            // console.log("rootPath",rootPath);
            
            var files = glob.sync(relativePath, { cwd: rootPath });
            // console.log("files:", files);
            if (files.length === 0) {
                return "Template:" + item + ",路径不存在";
            }
            tmplObj[item].pathName = path.resolve(path.join(rootPath, files[0]));
        }
        return tmplObj;
    };
    //根据Entity是否主从，获取相应的template
    TemplateHelper.prototype.getTemplatesByEntity = function (tmplObj, entity) {
        var clone = _.clone(tmplObj);
        if (entity.references.length > 0) {
            delete clone.controller;
            delete clone.viewAdd;
            delete clone.viewDetail;
            delete clone.viewEdit;
            delete clone.viewIndex;
        }
        else {
            delete clone.controllerHeaderDetail;
            delete clone.viewAddHeaderDetail;
            delete clone.viewDetailHeaderDetail;
            delete clone.viewEditHeaderDetail;
            delete clone.viewIndexHeaderDetail;
        }
        return clone;
    };
    //根据用户的选择过滤Entity[]
    TemplateHelper.prototype.getEntitiesByNameList = function (entities, nameList) {
        var list = nameList.map(function (x) { return x.entityName });
        var result = [];
        for (var i = 0; i < entities.length; i++) {
            var entityName = entities[i].name;
            if (_.contains(list, entityName)) {
                result.push(entities[i]);
            }
        }
        return result;
    };
    //套用模板（重新构造Entity）
    TemplateHelper.prototype.applyTemplate = function (content, entity, extensionName, nameSpace) {
        var obj = {};
        obj.entityName = entity.name;
        obj.nameSpace = nameSpace
        obj.columns = [];
        for (var i = 0; i < entity.properties.length; i++) {
            if (entity.properties[i] == null) {
                continue;
            }
            var column = {};
            column.desc = entity.properties[i].description;
            column.javaType = sqlTypeDict.java[entity.properties[i].dataType];
            column.name = entity.properties[i].name;
            column.precision = entity.properties[i].precision;
            column.length = entity.properties[i].length;
            column.scale = entity.properties[i].scale;
            column.nullable = entity.properties[i].nullable;
            
            
            obj.columns.push(column);
        }

        var codeContent = '';
        if (extensionName === 'jsp') {
            codeContent = _.template(content,{ interpolate: /<\$=([\s\S]+?)\$>/g, evaluate: /<\$([\s\S]+?)\$>/g })(obj);
        } else {
            codeContent = _.template(content)(obj);
        }
        return codeContent;
    }


    var h = new TemplateHelper();
    //console.log('on create,', h.setAbsolutePath);
    return h;
    // return TemplateHelper;
})();

module.exports = TemplateHelper;