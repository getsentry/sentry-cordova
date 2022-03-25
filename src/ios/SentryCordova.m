#import "SentryCordova.h"
#import <Cordova/CDVAvailability.h>
@import Sentry;

@interface SentrySDK ()

+ (SentryHub *)currentHub;

+ (void)captureEnvelope:(SentryEnvelope *)envelope;

+ (void)storeEnvelope:(SentryEnvelope *)envelope;

@end

@implementation SentryCordova {
  bool sentHybridSdkDidBecomeActive;
}

- (void)pluginInitialize {
  NSLog(@"Sentry Cordova Plugin initialized");
}

- (void)startWithOptions:(CDVInvokedUrlCommand *)command {
  NSDictionary *options = [command.arguments objectAtIndex:0];

  SentryBeforeSendEventCallback beforeSend =
      ^SentryEvent *(SentryEvent *event) {
    [self setEventOriginTag:event];

    return event;
  };
  [options setValue:beforeSend forKey:@"beforeSend"];

  NSError *error = nil;

  SentryOptions *sentryOptions = [[SentryOptions alloc] initWithDict:options
                                                    didFailWithError:&error];

  CDVPluginResult *result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
  if (error != nil) {
    NSLog(@"%@", error);
    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                 messageAsBool:NO];
  } else {
    [SentrySDK startWithOptionsObject:sentryOptions];

    // If the app is active/in foreground, and we have not sent the
    // SentryHybridSdkDidBecomeActive notification, send it.
    if ([[UIApplication sharedApplication] applicationState] ==
            UIApplicationStateActive &&
        !sentHybridSdkDidBecomeActive &&
        sentryOptions.enableAutoSessionTracking) {
      [[NSNotificationCenter defaultCenter]
          postNotificationName:@"SentryHybridSdkDidBecomeActive"
                        object:nil];

      sentHybridSdkDidBecomeActive = true;
    }
  }

  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)setEventOriginTag:(SentryEvent *)event {
  if (event.sdk != nil) {
    NSString *sdkName = event.sdk[@"name"];

    // If the event is from cordova js, it gets set there and we do not handle
    // it here.
    if ([sdkName isEqualToString:@"sentry.cocoa"]) {
      [self setEventEnvironmentTag:event origin:@"ios" environment:@"native"];
    }
  }
}

- (void)setEventEnvironmentTag:(SentryEvent *)event
                        origin:(NSString *)origin
                   environment:(NSString *)environment {
  NSMutableDictionary *newTags = [NSMutableDictionary new];
  if (nil != event.tags) {
    [newTags addEntriesFromDictionary:event.tags];
  }
  [newTags setValue:origin forKey:@"event.origin"];
  [newTags setValue:environment forKey:@"event.environment"];
  event.tags = newTags;
}

- (void)captureEnvelope:(CDVInvokedUrlCommand *)command {
  NSDictionary *headerDict = [command.arguments objectAtIndex:0];
  NSDictionary *payloadDict = [command.arguments objectAtIndex:1];

  CDVPluginResult *result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];

  if ([NSJSONSerialization isValidJSONObject:headerDict] &&
      [NSJSONSerialization isValidJSONObject:payloadDict]) {
    SentrySdkInfo *sdkInfo = [[SentrySdkInfo alloc] initWithDict:headerDict];
    SentryId *eventId =
        [[SentryId alloc] initWithUUIDString:headerDict[@"event_id"]];
    SentryEnvelopeHeader *envelopeHeader =
        [[SentryEnvelopeHeader alloc] initWithId:eventId sdkInfo:sdkInfo traceState:nil];

    NSError *error;
    NSData *envelopeItemData =
        [NSJSONSerialization dataWithJSONObject:payloadDict
                                        options:0
                                          error:&error];
    if (nil != error) {
      result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                   messageAsBool:NO];
    } else {
      NSString *itemType = payloadDict[@"type"];
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
      [SentrySDK captureEnvelope:envelope];
#else
      if ([payloadDict[@"level"] isEqualToString:@"fatal"]) {
        // Storing to disk happens asynchronously with captureEnvelope
        // We need to make sure the event is written to disk before resolving
        // the promise. This could be replaced by SentrySDK.flush() when
        // available.
        [SentrySDK storeEnvelope:envelope];
      } else {
        [SentrySDK captureEnvelope:envelope];
      }
#endif
    }
  } else {
    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                 messageAsBool:NO];
  }

  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)addBreadcrumb:(CDVInvokedUrlCommand *)command {
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
}

- (void)clearBreadcrumbs:(CDVInvokedUrlCommand *)command {
  [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
    [scope clearBreadcrumbs];
  }];
}

- (void)setUser:(CDVInvokedUrlCommand *)command {
  NSDictionary *user = [command.arguments objectAtIndex:0];
  NSDictionary *otherUserKeys = [command.arguments objectAtIndex:1];

  bool userIsNull = (nil == user || [user isEqual:[NSNull null]]);
  bool otherUserKeysIsNull =
      (nil == otherUserKeys || [otherUserKeys isEqual:[NSNull null]]);

  [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
    if (userIsNull && otherUserKeysIsNull) {
      [scope setUser:nil];
    } else {
      SentryUser *userInstance = [[SentryUser alloc] init];

      if (!userIsNull) {
        [userInstance setUserId:user[@"id"]];
        [userInstance setEmail:user[@"email"]];
        [userInstance setUsername:user[@"username"]];
      }

      if (!otherUserKeysIsNull) {
        [userInstance setData:otherUserKeys];
      }

      [scope setUser:userInstance];
    }
  }];
}

- (void)setExtra:(CDVInvokedUrlCommand *)command {
  NSString *key = [command.arguments objectAtIndex:0];
  NSString *extra = [command.arguments objectAtIndex:1];

  [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
    [scope setExtraValue:extra forKey:key];
  }];
}

- (void)setContext:(CDVInvokedUrlCommand *)command {
  NSString *key = [command.arguments objectAtIndex:0];
  NSDictionary *context = [command.arguments objectAtIndex:1];

  [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
    [scope setContextValue:context forKey:key];
  }];
}

- (void)setTag:(CDVInvokedUrlCommand *)command {
  NSString *key = [command.arguments objectAtIndex:0];
  NSString *value = [command.arguments objectAtIndex:1];

  [SentrySDK configureScope:^(SentryScope *_Nonnull scope) {
    [scope setTagValue:value forKey:key];
  }];
}

- (void)crash:(CDVInvokedUrlCommand *)command {
  [SentrySDK crash];
}

@end
