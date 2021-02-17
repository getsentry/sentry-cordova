#import <Cordova/CDVPlugin.h>

@interface SentryCordova : CDVPlugin
{
}

- (void)startWithOptions:(CDVInvokedUrlCommand *)command;
- (void)captureEnvelope:(CDVInvokedUrlCommand *)command;
- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command;
- (void)clearBreadcrumbs:(CDVInvokedUrlCommand *)command;
- (void)setUser:(CDVInvokedUrlCommand *)command;
- (void)setExtra:(CDVInvokedUrlCommand *)command;
- (void)setContext:(CDVInvokedUrlCommand *)command;
- (void)setTag:(CDVInvokedUrlCommand *)command;
- (void)crash:(CDVInvokedUrlCommand *)command;

@end
