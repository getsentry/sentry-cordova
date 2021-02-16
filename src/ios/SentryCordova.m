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
  CDVPluginResult *pluginResult =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                        messageAsString:@"ios"];
  ;

  [self.commandDelegate sendPluginResult:pluginResult
                              callbackId:command.callbackId];
}

- (void)startWithOptions:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSDictionary *options = [command.arguments objectAtIndex:0];

    SentryBeforeSendEventCallback beforeSend =
        ^SentryEvent *(SentryEvent *event) {
      [self setReleaseVersionDist:event];
      return event;
    };
    [options setValue:beforeSend forKey:@"beforeSend"];

    NSError *error = nil;

    SentryOptions *sentryOptions = [[SentryOptions alloc] initWithDict:options
                                                      didFailWithError:&error];

    CDVPluginResult *result =
        [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                            messageAsBool:YES];
    if (error != nil) {
      NSLog(@"%@", error);
      result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                   messageAsBool:NO];
    } else {
      [SentrySDK startWithOptionsObject:sentryOptions];
    }

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
  }];
}

- (void)setReleaseVersionDist:(SentryEvent *)event {
  if (event.extra[@"__sentry_version"]) {
    NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
    event.releaseName =
        [NSString stringWithFormat:@"%@-%@", infoDict[@"CFBundleIdentifier"],
                                   event.extra[@"__sentry_version"]];
  }
  if (event.extra[@"__sentry_release"]) {
    event.releaseName =
        [NSString stringWithFormat:@"%@", event.extra[@"__sentry_release"]];
  }
  if (event.extra[@"__sentry_dist"]) {
    event.dist =
        [NSString stringWithFormat:@"%@", event.extra[@"__sentry_dist"]];
  }
  event.sdk = @{
    @"name" : SentryCordovaSdkName,
    @"version" : SentryCordovaVersionString,
    @"integrations" : @[ @"sentry-cocoa" ]
  };
}

- (void)captureEnvelope:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSDictionary *envelopeDict = [command.arguments objectAtIndex:0];
    CDVPluginResult *result =
        [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                            messageAsBool:YES];

    if ([NSJSONSerialization isValidJSONObject:envelopeDict]) {
      SentrySdkInfo *sdkInfo =
          [[SentrySdkInfo alloc] initWithDict:envelopeDict[@"header"]];
      SentryId *eventId = [[SentryId alloc]
          initWithUUIDString:envelopeDict[@"header"][@"event_id"]];
      SentryEnvelopeHeader *envelopeHeader =
          [[SentryEnvelopeHeader alloc] initWithId:eventId andSdkInfo:sdkInfo];

      NSError *error;
      NSData *envelopeItemData =
          [NSJSONSerialization dataWithJSONObject:envelopeDict[@"payload"]
                                          options:0
                                            error:&error];
      if (nil != error) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                     messageAsBool:NO];
      } else {
        NSString *itemType = envelopeDict[@"payload"][@"type"];
        if (itemType == nil) {
          // Default to event type.
          itemType = @"event";
        }

        SentryEnvelopeItemHeader *envelopeItemHeader =
            [[SentryEnvelopeItemHeader alloc]
                initWithType:itemType
                      length:envelopeItemData.length];
        SentryEnvelopeItem *envelopeItem =
            [[SentryEnvelopeItem alloc] initWithHeader:envelopeItemHeader
                                                  data:envelopeItemData];

        SentryEnvelope *envelope =
            [[SentryEnvelope alloc] initWithHeader:envelopeHeader
                                        singleItem:envelopeItem];

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
      result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                   messageAsBool:NO];
    }

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
  }];
}

- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSDictionary *breadcrumb = [command.arguments objectAtIndex:0];

    [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
      SentryBreadcrumb *breadcrumbInstance = [[SentryBreadcrumb alloc] init];

      NSString *levelString = breadcrumb[@"level"];
      SentryLevel sentryLevel;
      if ([levelString isEqualToString:@"fatal"]) {
        sentryLevel = kSentryLevelFatal;
      } else if ([levelString isEqualToString:@"warning"]) {
        sentryLevel = kSentryLevelWarning;
      } else if ([levelString isEqualToString:@"info"]) {
        sentryLevel = kSentryLevelInfo;
      } else if ([levelString isEqualToString:@"debug"]) {
        sentryLevel = kSentryLevelDebug;
      } else {
        sentryLevel = kSentryLevelError;
      }
      [breadcrumbInstance setLevel:sentryLevel];

      [breadcrumbInstance setCategory:breadcrumb[@"category"]];

      [breadcrumbInstance setType:breadcrumb[@"type"]];

      [breadcrumbInstance setMessage:breadcrumb[@"message"]];

      [breadcrumbInstance setData:breadcrumb[@"data"]];

      [scope addBreadcrumb:breadcrumbInstance];
    }];
  }];
}

- (void)clearBreadcrumbs:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
      [scope clearBreadcrumbs];
    }];
  }];
}

- (void)setUser:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSDictionary *user = [command.arguments objectAtIndex:0];
    NSDictionary *otherUserKeys = [command.arguments objectAtIndex:1];

    [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
      if (nil == user && nil == otherUserKeys) {
        [scope setUser:nil];
      } else {
        SentryUser *userInstance = [[SentryUser alloc] init];

        if (nil != user) {
          [userInstance setUserId:user[@"id"]];
          [userInstance setEmail:user[@"email"]];
          [userInstance setUsername:user[@"username"]];
        }

        if (nil != otherUserKeys) {
          [userInstance setData:otherUserKeys];
        }

        [scope setUser:userInstance];
      }
    }];
  }];
}

- (void)setExtra:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSString *key = [command.arguments objectAtIndex:0];
    NSString *extra = [command.arguments objectAtIndex:1];

    [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
      [scope setExtraValue:extra forKey:key];
    }];
  }];
}

- (void)setContext:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSString *key = [command.arguments objectAtIndex:0];
    NSDictionary *context = [command.arguments objectAtIndex:1];

    [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
      [scope setContextValue:context forKey:key];
    }];
  }];
}

- (void)setTag:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    NSString *key = [command.arguments objectAtIndex:0];
    NSString *value = [command.arguments objectAtIndex:1];

    [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
      [scope setTagValue:value forKey:key];
    }];
  }];
}

- (void)crash:(CDVInvokedUrlCommand *)command {
  [self.commandDelegate runInBackground:^{
    [SentrySDK crash];
  }];
}

@end
