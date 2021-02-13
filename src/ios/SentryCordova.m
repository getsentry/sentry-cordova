#import "SentryCordova.h"
#import <Cordova/CDVAvailability.h>
@import Sentry;

NSString *const SentryCordovaVersionString = @"0.17.0";
NSString *const SentryCordovaSdkName = @"sentry-cordova";

@implementation SentryCordova

- (void)pluginInitialize {
    NSLog(@"Sentry Cordova Plugin initialized");
}

- (void)getPlatform:(CDVInvokedUrlCommand *)command {
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"ios"];;

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)startWithOptions:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *options = [command.arguments objectAtIndex:0];

        SentryBeforeSendEventCallback beforeSend = ^SentryEvent*(SentryEvent *event) {
          [self setReleaseVersionDist:event];
          return event;
        };
        [options setValue:beforeSend forKey:@"beforeSend"];

        NSError *error = nil;

        SentryOptions *sentryOptions = [[SentryOptions alloc] initWithDict:options didFailWithError:&error];

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
        if (error != nil) {
            NSLog(@"%@", error);
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
        }
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

- (void)captureEnvelope:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *envelopeDict = [command.arguments objectAtIndex:0];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];

        if ([NSJSONSerialization isValidJSONObject:envelopeDict]) {
        SentrySdkInfo *sdkInfo = [[SentrySdkInfo alloc] initWithDict:envelopeDict[@"header"]];
        SentryId *eventId = [[SentryId alloc] initWithUUIDString:envelopeDict[@"header"][@"event_id"]];
        SentryEnvelopeHeader *envelopeHeader = [[SentryEnvelopeHeader alloc] initWithId:eventId andSdkInfo:sdkInfo];

        NSError *error;
        NSData *envelopeItemData = [NSJSONSerialization dataWithJSONObject:envelopeDict[@"payload"] options:0 error:&error];
        if (nil != error) {
          result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
        } else {
            NSString *itemType = envelopeDict[@"payload"][@"type"];
            if (itemType == nil) {
                // Default to event type.
                itemType = @"event";
            }

            SentryEnvelopeItemHeader *envelopeItemHeader = [[SentryEnvelopeItemHeader alloc] initWithType:itemType length:envelopeItemData.length];
            SentryEnvelopeItem *envelopeItem = [[SentryEnvelopeItem alloc] initWithHeader:envelopeItemHeader data:envelopeItemData];

            SentryEnvelope *envelope = [[SentryEnvelope alloc] initWithHeader:envelopeHeader singleItem:envelopeItem];

            #if DEBUG
                [[SentrySDK currentHub] captureEnvelope:envelope];
            #else
                if ([envelopeDict[@"payload"][@"level"] isEqualToString:@"fatal"]) {
                    // Storing to disk happens asynchronously with captureEnvelope
                    // We need to make sure the event is written to disk before resolving the promise.
                    // This could be replaced by SentrySDK.flush() when available.
                    [[[SentrySDK currentHub] getClient] storeEnvelope:envelope];
                } else {
                    [[SentrySDK currentHub] captureEnvelope:envelope];
                }
            #endif
          }
      } else {
          result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsBool:NO];
      }

      [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        // NSDictionary *jsonBreadcrumb = [command.arguments objectAtIndex:0];
        // if ([jsonBreadcrumb isKindOfClass:NSDictionary.class]) {
        //   SentryBreadcrumb *breadcrumb = [SentryJavaScriptBridgeHelper createSentryBreadcrumbFromJavaScriptBreadcrumb:jsonBreadcrumb];
        //   [SentryClient.sharedClient.breadcrumbs addBreadcrumb:breadcrumb];
        //   CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[breadcrumb serialize]];
        //   [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        // }
    }];
}


- (void)setUserContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        // id arg = [command.arguments objectAtIndex:0];
        // if ([arg isKindOfClass:NSDictionary.class]) {
        //     SentryClient.sharedClient.user = [SentryJavaScriptBridgeHelper createSentryUserFromJavaScriptUser:arg];
        // }
    }];
}

- (void)setTagsContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        // if (SentryClient.sharedClient && SentryClient.sharedClient.tags) {
        //     id dict = [command.arguments objectAtIndex:0];
        //     if ([dict isKindOfClass:NSDictionary.class]) {
        //         NSMutableDictionary *newDict = [NSMutableDictionary new];
        //         [newDict addEntriesFromDictionary:SentryClient.sharedClient.tags];
        //         [newDict addEntriesFromDictionary:dict];
        //         SentryClient.sharedClient.tags = newDict;
        //     }
        // }
    }];
}

- (void)setExtraContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        // if (SentryClient.sharedClient && SentryClient.sharedClient.extra) {
        //     id dict = [command.arguments objectAtIndex:0];
        //     if ([dict isKindOfClass:NSDictionary.class]) {
        //         NSMutableDictionary *newDict = [NSMutableDictionary new];
        //         [newDict addEntriesFromDictionary:SentryClient.sharedClient.extra];
        //         [newDict addEntriesFromDictionary:dict];
        //         SentryClient.sharedClient.extra = newDict;
        //     }
        // }
    }];
}

- (void)clearContext:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        // [SentryClient.sharedClient clearContext];
    }];
}

@end
