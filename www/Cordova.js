"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var browser_1 = require("@sentry/browser");
var Cordova = /** @class */ (function (_super) {
    __extends(Cordova, _super);
    function Cordova(client, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, client, options) || this;
        _this.options = options;
        _this.PLUGIN_NAME = 'Sentry';
        _this.client = client;
        if (window && window.Cordova && window.Cordova.exec) {
            _this.cordovaExec = window.Cordova.exec;
        }
        else {
            _this.cordovaExec = function () {
                var params = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    params[_i] = arguments[_i];
                }
                // eslint-disable-next-line
                client.log(params);
            };
        }
        return _this;
    }
    Cordova.prototype.install = function () {
        var _this = this;
        _super.prototype.setOptions.call(this, {
            allowDuplicates: true
        });
        _super.prototype.install.call(this);
        _super.prototype.setBreadcrumbCallback.call(this, function (crumb) { return _this.captureBreadcrumb(crumb); });
        return new Promise(function (resolve, reject) {
            _this.cordovaExec(function (result) { return resolve(result); }, function (error) { return reject(error); }, _this.PLUGIN_NAME, 'install', [_this.client.dsn.getDsn(true), _this.options]);
        });
    };
    Cordova.prototype.setOptions = function (options) {
        Object.assign(this.options, options);
        return this;
    };
    Cordova.prototype.captureBreadcrumb = function (crumb) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.cordovaExec(function (result) { return resolve(result); }, function (error) { return reject(error); }, _this.PLUGIN_NAME, 'captureBreadcrumb', [crumb]);
        });
    };
    Cordova.prototype.send = function (event) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.cordovaExec(function (result) { return resolve(result); }, function (error) { return reject(error); }, _this.PLUGIN_NAME, 'sendEvent', [event]);
        });
    };
    Cordova.prototype.setUserContext = function (user) {
        this.cordovaExec(null, null, this.PLUGIN_NAME, 'setUserContext', [user]);
        return this;
    };
    Cordova.prototype.setTagsContext = function (tags) {
        this.cordovaExec(null, null, this.PLUGIN_NAME, 'setTagsContext', [tags]);
        return this;
    };
    Cordova.prototype.setExtraContext = function (extra) {
        this.cordovaExec(null, null, this.PLUGIN_NAME, 'setExtraContext', [extra]);
        return this;
    };
    Cordova.prototype.addExtraContext = function (key, value) {
        this.cordovaExec(null, null, this.PLUGIN_NAME, 'addExtraContext', [key, value]);
        return this;
    };
    Cordova.prototype.clearContext = function () {
        this.cordovaExec(null, null, this.PLUGIN_NAME, 'clearContext', []);
        return this;
    };
    return Cordova;
}(browser_1.Browser));
exports.Cordova = Cordova;
