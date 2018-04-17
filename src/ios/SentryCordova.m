#import "SentryCordova.h"
#import <Cordova/CDVAvailability.h>
@import Sentry;

NSString *const SentryCordovaVersionString = @"0.9.1";
NSString *const SentryCordovaSdkName = @"sentry-cordova";

@implementation SentryCordova

- (void)pluginInitialize {
    NSLog(@"Sentry Cordova Plugin initialized");
}

- (void)install:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSString *dsn = [command.arguments objectAtIndex:0];
        NSError *error = nil;
        SentryClient *client = [[SentryClient alloc] initWithDsn:dsn didFailWithError:&error];
        SentryClient.sharedClient = client;
        [SentryClient.sharedClient startCrashHandlerWithError:&error];
        client.beforeSerializeEvent = ^(SentryEvent * _Nonnull event) {
            [self setReleaseVersionDist:event];
        };
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
        if (error != nil) {
            NSLog(@"%@", error);
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
        }
        [SentryClient.sharedClient enableAutomaticBreadcrumbTracking];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)setReleaseVersionDist:(SentryEvent *)event {
    if (event.extra[@"__sentry_version"]) {
        NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
        event.releaseName = [NSString stringWithFormat:@"%@-%@", infoDict[@"CFBundleIdentifier"], event.extra[@"__sentry_version"]];
    }
    if (event.extra[@"__sentry_release"]) {
        event.releaseName = [NSString stringWithFormat:@"%@", event.extra[@"__sentry_release"]];
    }
    if (event.extra[@"__sentry_dist"]) {
        event.dist = [NSString stringWithFormat:@"%@", event.extra[@"__sentry_dist"]];
    }
    event.sdk = @{@"name": SentryCordovaSdkName,
                  @"version": SentryCordovaVersionString,
                  @"integrations": @[@"sentry-cocoa"]};
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

- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command {
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
        id arg = [command.arguments objectAtIndex:0];
        if ([arg isKindOfClass:NSDictionary.class]) {
            SentryClient.sharedClient.user = [SentryJavaScriptBridgeHelper createSentryUserFromJavaScriptUser:arg];
        }
    }];
}

- (void)setTagsContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        if (SentryClient.sharedClient && SentryClient.sharedClient.tags) {
            id dict = [command.arguments objectAtIndex:0];
            if ([dict isKindOfClass:NSDictionary.class]) {
                NSMutableDictionary *newDict = [NSMutableDictionary new];
                [newDict addEntriesFromDictionary:SentryClient.sharedClient.tags];
                [newDict addEntriesFromDictionary:dict];
                SentryClient.sharedClient.tags = newDict;
            }
        }
    }];
}

- (void)setExtraContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        if (SentryClient.sharedClient && SentryClient.sharedClient.extra) {
            id dict = [command.arguments objectAtIndex:0];
            if ([dict isKindOfClass:NSDictionary.class]) {
                NSMutableDictionary *newDict = [NSMutableDictionary new];
                [newDict addEntriesFromDictionary:SentryClient.sharedClient.extra];
                [newDict addEntriesFromDictionary:dict];
                SentryClient.sharedClient.extra = newDict;
            }
        }
    }];
}

- (void)clearContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        [SentryClient.sharedClient clearContext];
    }];
}

@end
