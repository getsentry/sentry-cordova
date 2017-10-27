#import <Cordova/CDVPlugin.h>

@interface SentryCordova : CDVPlugin {
}

- (void)install:(CDVInvokedUrlCommand *)command;
- (void)sendEvent:(CDVInvokedUrlCommand *)command;
- (void)captureBreadcrumb:(CDVInvokedUrlCommand *)command;

@end
