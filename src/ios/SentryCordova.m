#import "SentryCordova.h"
#import <Cordova/CDVAvailability.h>
@import Sentry;

@implementation SentryCordova

- (void)pluginInitialize {
    NSLog(@"Sentry Cordova Plugin initialized");
}

- (void)install:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSString *dsn = [command.arguments objectAtIndex:0];
        //    NSString *options = [command.arguments objectAtIndex:1];
        NSError *error = nil;
        SentryClient *client = [[SentryClient alloc] initWithDsn:dsn didFailWithError:&error];
        SentryClient.sharedClient = client;
        [SentryClient.sharedClient startCrashHandlerWithError:&error];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
        if (error != nil) {
            NSLog(@"%@", error);
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
        }
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)sendEvent:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        BOOL shouldSend = NO;
        NSDictionary *jsonEvent = [command.arguments objectAtIndex:0];
        SentryEvent *event = [SentryJavaScriptBridgeHelper createSentryEventFromJavaScriptEvent:jsonEvent];
        if (event.exceptions) {
#if DEBUG
            // We want to send the exception instead of storing it because in debug
            // the app does not crash it will restart
            shouldSend = YES;
#else
            [SentryClient.sharedClient storeEvent:event];
#endif
        } else {
            shouldSend = YES;
        }

        if (shouldSend && SentryClient.sharedClient != nil) {
            [SentryClient.sharedClient sendEvent:event withCompletionHandler:^(NSError * _Nullable error) {
                CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[event serialize]];
                if (error != nil) {
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
                }
                [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            }];
        }
    }];
}

- (void)captureBreadcrumb:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsonBreadcrumb = [command.arguments objectAtIndex:0];
        SentryBreadcrumb *breadcrumb = [SentryJavaScriptBridgeHelper createSentryBreadcrumbFromJavaScriptBreadcrumb:jsonBreadcrumb];
        [SentryClient.sharedClient.breadcrumbs addBreadcrumb:breadcrumb];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[breadcrumb serialize]];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)setUserContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsonUser = [command.arguments objectAtIndex:0];
        SentryClient.sharedClient.user = [SentryJavaScriptBridgeHelper createSentryUserFromJavaScriptUser:jsonUser];
    }];
}

- (void)setTagsContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsonTags = [command.arguments objectAtIndex:0];
        SentryClient.sharedClient.tags = jsonTags;
    }];
}

- (void)setExtraContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsonExtra = [command.arguments objectAtIndex:0];
        SentryClient.sharedClient.extra = jsonExtra;
    }];
}

- (void)addExtraContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSString *key = [command.arguments objectAtIndex:0];
        id value = [command.arguments objectAtIndex:1];
        NSMutableDictionary *prevExtra = SentryClient.sharedClient.extra.mutableCopy;
        [prevExtra setValue:value forKey:key];
        SentryClient.sharedClient.extra = prevExtra;
    }];
}

- (void)clearContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        [SentryClient.sharedClient clearContext];
    }];
}

@end
