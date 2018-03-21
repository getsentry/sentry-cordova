#import <Cordova/CDVPlugin.h>

@interface SentryCordova : CDVPlugin {
}

- (void)install:(CDVInvokedUrlCommand *)command;
- (void)sendEvent:(CDVInvokedUrlCommand *)command;
- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command;
- (void)setUserContext:(CDVInvokedUrlCommand *)command;
- (void)setTagsContext:(CDVInvokedUrlCommand *)command;
- (void)setExtraContext:(CDVInvokedUrlCommand *)command;
- (void)clearContext:(CDVInvokedUrlCommand *)command;

@end
