
(function(window){
    document.getElementById("exception").addEventListener("click", buttonClick);
    document.getElementById("nativeexception").addEventListener("click", native);
    document.getElementById("capturemessage").addEventListener("click", captureMessage);
    document.getElementById("addtag").addEventListener("click", setTag);
    document.getElementById("addbreadcrumb").addEventListener("click", addBreadcrumb);
})(window);


function buttonClick(){ {
    console.log("execute capture error");
    try {
        data_throwerror();

    } catch (error) {
        var Sentry = cordova.require("sentry-cordova.Sentry", "debug");
        Sentry.captureException(error);

    }

}}

function captureMessage(){ {
    console.log("execute capture message");
    var Sentry = cordova.require("sentry-cordova.Sentry", "debug");
    Sentry.captureMessage('test');
}}

function native(){ {
    console.log("execute native");
    var Sentry = cordova.require("sentry-cordova.Sentry");
    Sentry.nativeCrash();

}}


function addBreadcrumb(){ {
    console.log("execute addbreadcrumb");
    var Sentry = cordova.require("sentry-cordova.Sentry");
    Sentry.addBreadcrumb({
        category: "auth",
        message: "Authenticated user 1234",
        level: "log",
      });
}}

function setTag(){ {
    console.log("execute settag");
    var Sentry = cordova.require("sentry-cordova.Sentry");
    Sentry.setTag("tag", "value");

}}

