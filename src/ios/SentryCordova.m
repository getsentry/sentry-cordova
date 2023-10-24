#import "SentryCordova.h"
#import <Sentry/Sentry.h>
#import <Sentry/PrivateSentrySDKOnly.h>
#import <Sentry/SentryOptions+HybridSDKs.h>
#import <Cordova/CDVAvailability.h>
@import Sentry;

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

    SentryOptions* sentryOptions = [self createOptionsWithDictionary:options error:&error];
    if (error != nil) {
        NSLog(@"%@", error);
        return;
    }

  CDVPluginResult *result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
  if (error != nil) {
    NSLog(@"%@", error);
    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                 messageAsBool:NO];
  } else {
      [SentrySDK startWithOptions:sentryOptions];

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

- (SentryOptions *_Nullable)createOptionsWithDictionary:(NSDictionary *_Nonnull)options
                                         error: (NSError *_Nonnull *_Nonnull) errorPointer
{
    SentryBeforeSendEventCallback beforeSend = ^SentryEvent*(SentryEvent *event) {
        // We don't want to send an event after startup that came from a Unhandled JS Exception of Cordova
        // Because we sent it already before the app crashed.
        if (nil != event.exceptions.firstObject.type &&
            [event.exceptions.firstObject.type rangeOfString:@"Unhandled JS Exception"].location != NSNotFound) {
            NSLog(@"Unhandled JS Exception");
            return nil;
        }

        [self setEventOriginTag:event];

        return event;
    };

    NSMutableDictionary * mutableOptions =[options mutableCopy];
    [mutableOptions setValue:beforeSend forKey:@"beforeSend"];

    // remove performance traces sample rate and traces sampler since we don't want to synchronize these configurations
    // to the Native SDKs.
    // The user could tho initialize the SDK manually and set themselves.
    [mutableOptions removeObjectForKey:@"tracesSampleRate"];
    [mutableOptions removeObjectForKey:@"tracesSampler"];
    [mutableOptions removeObjectForKey:@"enableTracing"];

    SentryOptions *sentryOptions = [[SentryOptions alloc] initWithDict:mutableOptions didFailWithError:errorPointer];
    if (*errorPointer != nil) {
        NSLog(@"Failed to create Sentry options.");
        return nil;
    }

    if ([mutableOptions valueForKey:@"enableNativeCrashHandling"] != nil) {
        BOOL enableNativeCrashHandling = [mutableOptions[@"enableNativeCrashHandling"] boolValue];

        if (!enableNativeCrashHandling) {
            NSMutableArray *integrations = sentryOptions.integrations.mutableCopy;
            [integrations removeObject:@"SentryCrashIntegration"];
            sentryOptions.integrations = integrations;
        }
    }

    // Enable the App start and Frames tracking measurements
    if ([mutableOptions valueForKey:@"enableAutoPerformanceTracing"] != nil) {
        BOOL enableAutoPerformanceTracing = [mutableOptions[@"enableAutoPerformanceTracing"] boolValue];
        PrivateSentrySDKOnly.appStartMeasurementHybridSDKMode = enableAutoPerformanceTracing;
#if TARGET_OS_IPHONE || TARGET_OS_MACCATALYST
        PrivateSentrySDKOnly.framesTrackingMeasurementHybridSDKMode = enableAutoPerformanceTracing;
#endif
    }

    return sentryOptions;
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

    CDVPluginResult *result =
        [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];

    NSDictionary *commandDictionary = [command.arguments objectAtIndex:0];
    NSArray *bytes = commandDictionary[@"envelope"];

    NSMutableData *data = [[NSMutableData alloc] initWithCapacity: [bytes count]];
    for(NSNumber *number in bytes) {
        char byte = [number charValue];
        [data appendBytes: &byte length: 1];
    }

    SentryEnvelope *envelope = [PrivateSentrySDKOnly envelopeWithData:data];

    if (envelope == nil) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                     messageAsBool:NO];
    }
    else {
    #if DEBUG
        [PrivateSentrySDKOnly captureEnvelope:envelope];
    #else
        if (commandDictionary[@'store']) {
            // Storing to disk happens asynchronously with captureEnvelope
            [PrivateSentrySDKOnly storeEnvelope:envelope];
        } else {
            [PrivateSentrySDKOnly captureEnvelope:envelope];
        }
    #endif
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
