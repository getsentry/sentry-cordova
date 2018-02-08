"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var CORDOVA_DEVICE_RDY_TIMEOUT = 10000;
var SentryCordova = /** @class */ (function () {
    function SentryCordova(client, options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.internalOptions = {};
        this.PLUGIN_NAME = 'Sentry';
        this.PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;
        this.client = client;
        if (!options.sentryBrowser) {
            throw new Error('must pass SentryBrowser as an option { sentryBrowser: SentryBrowser }');
        }
        this.browser = new options.sentryBrowser(client);
        return this;
    }
    SentryCordova.prototype.install = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.browser.setOptions({
                            allowDuplicates: true,
                        });
                        return [4 /*yield*/, this.browser.install()];
                    case 1:
                        _a.sent();
                        // This will prefix frames in raven with app://
                        // this is just a fallback if native is not available
                        this.setupNormalizeFrames();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                if (_this.isCordova()) {
                                    var timeout_1 = _this.options.deviceReadyTimeout || CORDOVA_DEVICE_RDY_TIMEOUT;
                                    var deviceReadyTimeout_1 = setTimeout(function () {
                                        reject("deviceready wasn't called for " + timeout_1 + " ms");
                                    }, timeout_1);
                                    _this.deviceReadyCallback = function () {
                                        return _this.runInstall(resolve, reject, deviceReadyTimeout_1);
                                    };
                                    document.addEventListener('deviceready', _this.deviceReadyCallback);
                                }
                                else {
                                    // We are in a browser
                                    _this.runInstall(resolve, reject);
                                }
                            })
                                .then(function (success) {
                                if (success && _this.isCordova()) {
                                    // We only want to register the breadcrumbcallback on success and running on
                                    // Cordova otherwise we will get an endless loop
                                    _this.browser.setBreadcrumbCallback(function (crumb) { return _this.captureBreadcrumb(crumb); });
                                }
                                _this.tryToSetSentryRelease();
                                return Promise.resolve(success);
                            })
                                .catch(function (reason) { return Promise.reject(reason); })];
                }
            });
        });
    };
    SentryCordova.prototype.getBrowser = function () {
        return this.browser;
    };
    SentryCordova.prototype.setOptions = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                Object.assign(this.options, options);
                return [2 /*return*/, this];
            });
        });
    };
    SentryCordova.prototype.captureException = function (exception) {
        return this.browser.captureException(exception);
    };
    SentryCordova.prototype.captureMessage = function (message) {
        return this.browser.captureMessage(message);
    };
    SentryCordova.prototype.captureBreadcrumb = function (crumb) {
        return this.nativeCall('captureBreadcrumb', crumb);
    };
    SentryCordova.prototype.send = function (event) {
        return this.nativeCall('send', event);
    };
    SentryCordova.prototype.setUserContext = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nativeCall('setUserContext', user)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    SentryCordova.prototype.setTagsContext = function (tags) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nativeCall('setTagsContext', tags)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    SentryCordova.prototype.setExtraContext = function (extra) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nativeCall('setExtraContext', extra)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    SentryCordova.prototype.clearContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.nativeCall('clearContext')];
            });
        });
    };
    SentryCordova.prototype.setRelease = function (release) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setInternalOption('release', release)];
            });
        });
    };
    SentryCordova.prototype.setDist = function (dist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setInternalOption('dist', dist)];
            });
        });
    };
    SentryCordova.prototype.setVersion = function (version) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setInternalOption('version', version)];
            });
        });
    };
    // Private helpers
    SentryCordova.prototype.setInternalOption = function (key, value) {
        return this.setExtraContext((_a = {},
            _a["__sentry_" + key] = value,
            _a));
        var _a;
    };
    SentryCordova.prototype.tryToSetSentryRelease = function () {
        if (window.SENTRY_RELEASE !== undefined && window.SENTRY_RELEASE.id !== undefined) {
            this.setRelease(window.SENTRY_RELEASE.id);
            this.browser.getRaven().setRelease(window.SENTRY_RELEASE.id);
            this.client.log('received release from window.SENTRY_RELEASE');
        }
    };
    // ---------------------------------------
    // CORDOVA --------------------
    SentryCordova.prototype.isCordova = function () {
        return window.cordova !== undefined || window.Cordova !== undefined;
    };
    SentryCordova.prototype.nativeCall = function (action) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            var exec = window && window.Cordova && window.Cordova.exec;
            if (!exec) {
                reject('Cordova.exec not available');
            }
            else {
                window.Cordova.exec(resolve, reject, _this.PLUGIN_NAME, action, args);
            }
        }).catch(function (e) {
            if (e === 'not implemented' || e === 'Cordova.exec not available') {
                // This is our fallback to the browser implementation
                var browserCast = _this.browser;
                return browserCast[action].apply(browserCast, args);
            }
            throw e;
        });
    };
    SentryCordova.prototype.runInstall = function (resolve, reject, deviceReadyTimeout) {
        if (deviceReadyTimeout) {
            document.removeEventListener('deviceready', this.deviceReadyCallback);
            clearTimeout(deviceReadyTimeout);
        }
        this.nativeCall('install', this.client.dsn.getDsn(true), this.options)
            .then(resolve)
            .catch(reject);
    };
    // ----------------------------------------------------------
    // Raven
    SentryCordova.prototype.wrappedCallback = function (callback) {
        function dataCallback(data, original) {
            var normalizedData = callback(data) || data;
            if (original) {
                return original(normalizedData) || normalizedData;
            }
            return normalizedData;
        }
        return dataCallback;
    };
    SentryCordova.prototype.setupNormalizeFrames = function () {
        var _this = this;
        var raven = this.browser.getRaven();
        raven.setDataCallback(this.wrappedCallback(function (data) {
            data = _this.normalizeData(data);
            // TODO
            // if (internalDataCallback) {
            //   internalDataCallback(data);
            // }
        }));
    };
    SentryCordova.prototype.normalizeUrl = function (url, pathStripRe) {
        return 'app://' + url.replace(/^file\:\/\//, '').replace(pathStripRe, '');
    };
    SentryCordova.prototype.normalizeData = function (data, pathStripRe) {
        var _this = this;
        if (data.culprit) {
            data.culprit = this.normalizeUrl(data.culprit, this.PATH_STRIP_RE);
        }
        // NOTE: if data.exception exists, exception.values and exception.values[0] are
        // guaranteed to exist
        var stacktrace = data.stacktrace || (data.exception && data.exception.values[0].stacktrace);
        if (stacktrace) {
            stacktrace.frames.forEach(function (frame) {
                if (frame.filename !== '[native code]') {
                    frame.filename = _this.normalizeUrl(frame.filename, _this.PATH_STRIP_RE);
                }
            });
        }
        return data;
    };
    return SentryCordova;
}());
exports.SentryCordova = SentryCordova;
//# sourceMappingURL=SentryCordova.js.map