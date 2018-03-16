#import <Cordova/CDVPlugin.h>

@interface SentryCordova : CDVPlugin {
}

- (void)install:(CDVInvokedUrlCommand *)command;
- (void)sendEvent:(CDVInvokedUrlCommand *)command;
- (void)storeBreadcrumbs:(CDVInvokedUrlCommand *)command;
- (void)loadBreadcrumbs:(CDVInvokedUrlCommand *)command;
- (void)storeContext:(CDVInvokedUrlCommand *)command;
- (void)clearContext:(CDVInvokedUrlCommand *)command;

@end
