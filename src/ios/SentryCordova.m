#import "SentryCordova.h"
#import <Cordova/CDVAvailability.h>
@import Sentry;

NSString *const SentryCordovaVersionString = @"0.16.2";
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
        NSDictionary *jsonEvent = [command.arguments objectAtIndex:0];
        if ([NSJSONSerialization isValidJSONObject:jsonEvent]) {
            NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonEvent
                                                               options:0
                                                                 error:nil];

            SentryEvent *sentryEvent = [[SentryEvent alloc] initWithJSON:jsonData];
            if (SentryClient.sharedClient != nil) {
                [SentryClient.sharedClient sendEvent:sentryEvent withCompletionHandler:^(NSError * _Nullable error) {
                    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
                    if (error != nil) {
                        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
                    }
                    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
                }];
            }
        }
    }];
}

- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsonBreadcrumb = [command.arguments objectAtIndex:0];
        if ([jsonBreadcrumb isKindOfClass:NSDictionary.class]) {
          SentryBreadcrumb *breadcrumb = [SentryJavaScriptBridgeHelper createSentryBreadcrumbFromJavaScriptBreadcrumb:jsonBreadcrumb];
          [SentryClient.sharedClient.breadcrumbs addBreadcrumb:breadcrumb];
          CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[breadcrumb serialize]];
          [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }
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
