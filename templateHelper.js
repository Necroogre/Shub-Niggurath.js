/* global Promise */
var glob = require("glob");
var path = require('path');
var _ = require('underscore');
var sqlTypeDict = require('./cfg/sqlTypeDict.json');


var TemplateHelper = (function () {

    function TemplateHelper() {
    }
    
    //匹配所有模板绝对路径
    TemplateHelper.prototype.setAbsolutePath = function (tmplObj, rootPath) {
        return new Promise(function (resolve, reject) {
            var cloned = {};
            var allGlobTask = [];
            for (var item in tmplObj) {
                if (tmplObj.hasOwnProperty(item)) {
                    (function (key) {
                        var clonedItem = _.clone(tmplObj[key]);
                        var relativePath = tmplObj[key].pathName;
                        var globTask = new Promise(function (fullfill, rej) {
                            glob(relativePath, { cwd: rootPath }, function (err, files) {
                                if (err) { rej(err); }
                                if (files.length === 0) { rej(new Error("Template:" + key + ", 路径不存在")); }
                                clonedItem.pathName = path.resolve(path.join(rootPath, files[0]));
                                cloned[key] = clonedItem;
                                //console.log('[DEBUG] TemplateHelper.setAbsolutePath().globTask, ', clonedItem);
                                fullfill(clonedItem);
                            });
                        });
                        allGlobTask.push(globTask);
                    })(item);
                }
            }
            //console.log('[DEBUG] TemplateHelper.setAbsolutePath() allGlobTask, ', allGlobTask.length);
            Promise.all(allGlobTask).then(function () {
                //console.log('[DEBUG] TemplateHelper.setAbsolutePath(), ', cloned);
                resolve(cloned);
            }).catch(function (err) {
                console.log('[ERROR] TemplateHelper.setAbsolutePath() Error: ', err);
                reject(err);
            });
        });
    };
    
    //根据Entity是否主从，获取相应的template
    TemplateHelper.prototype.getTemplatesByEntity = function (tmplObj, entity) {
        //console.log('[DEBUG] TemplateHelper.getTemplatesByEntity()', tmplObj);
        var cloned = {};
        for (var item in tmplObj) {
            if (tmplObj.hasOwnProperty(item)) {
                var clonedItem = _.clone(tmplObj[item]);
                cloned[item] = clonedItem;
            }
        }
        if (entity.references.length > 0) {
            delete cloned.controller;
            delete cloned.viewAdd;
            delete cloned.viewDetail;
            delete cloned.viewEdit;
            delete cloned.viewIndex;
        }
        else {
            delete cloned.controllerHeaderDetail;
            delete cloned.viewAddHeaderDetail;
            delete cloned.viewDetailHeaderDetail;
            delete cloned.viewEditHeaderDetail;
            delete cloned.viewIndexHeaderDetail;
        }
        return cloned;
    };
    
    //根据用户的选择过滤Entity[]
    TemplateHelper.prototype.getEntitiesByNameList = function (entities, nameList) {
        var list = nameList.map(function (x) { return x.entityName; });
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
        //console.log('[DEBUG] TemplateHelper.applyTemplate() rebuild entity', obj);
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
        var _this = this;
        obj.entityName = entity.name;

        obj.columns = entity.properties.map(function (prop) {
            var wrapped = {
                desc: prop.description,
                javaType: sqlTypeDict.java[prop.dataType],
                name: prop.name,
                precision: prop.precision,
                length: prop.length,
                scale: prop.scale,
                nullable: prop.nullable
            };
            return wrapped;
        });
        if (entity.references && entity.references.length) {
            obj.references = entity.references.map(function (refObj) {
                return {
                    refEntity: _this.wrapEntity(refObj.refEntity),
                    propertyName: refObj.propertyName,
                    refPropertyName: refObj.refPropertyName
                };
            });
        } else {
            obj.references = [];
        }
        // if (obj.entityName === 'Detail') {
        //     console.log('detail columns:', obj, entity.properties);
        // }
        return obj;
    };


    var exportObj = new TemplateHelper();
    return exportObj;
})();

module.exports = TemplateHelper;