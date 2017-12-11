#import <Cordova/CDVPlugin.h>

@interface SentryCordova : CDVPlugin {
}

- (void)install:(CDVInvokedUrlCommand *)command;
- (void)send:(CDVInvokedUrlCommand *)command;
- (void)captureBreadcrumb:(CDVInvokedUrlCommand *)command;
- (void)setUserContext:(CDVInvokedUrlCommand *)command;
- (void)setTagsContext:(CDVInvokedUrlCommand *)command;
- (void)setExtraContext:(CDVInvokedUrlCommand *)command;
- (void)clearContext:(CDVInvokedUrlCommand *)command;

@end
