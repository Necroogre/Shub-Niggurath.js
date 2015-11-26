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
    TemplateHelper.prototype.applyTemplate = function (tmplContent, entity, extensionName, nameSpace) {
        var obj = this.wrapEntity(entity);
        obj.nameSpace = nameSpace;

        var codeContent = '';
        if (extensionName === 'jsp') {
            codeContent = _.template(tmplContent, { interpolate: /<\$=([\s\S]+?)\$>/g, evaluate: /<\$([\s\S]+?)\$>/g })(obj);
        } else {
            codeContent = _.template(tmplContent)(obj);
        }
        return codeContent;
    };

    TemplateHelper.prototype.wrapEntity = function (entity) {
        var obj = {};
        obj.entityName = entity.name;
        obj.columns = entity.properties.map(function (prop) {
            return {
                desc: prop.description,
                javaType: sqlTypeDict.java[prop.dataType],
                name: prop.name,
                precision: prop.precision,
                length: prop.length,
                scale: prop.scale,
                nullable: prop.nullable
            };
        });
        return obj;
    };


    var exportObj = new TemplateHelper();
    return exportObj;
})();

module.exports = TemplateHelper;