#import "SentryCordova.h"
#import "SentryNativeHelper.h"
#import <Cordova/CDVAvailability.h>

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
        // TODO: parse parameters of event
        SentrySeverity level = [SentryNativeHelper sentrySeverityFromLevel:jsonEvent[@"level"]];
        SentryEvent *event = [[SentryEvent alloc] initWithLevel:level];
        if (jsonEvent[@"event_id"]) {
            event.eventId = jsonEvent[@"event_id"];
        }
        event.message = jsonEvent[@"message"];
        event.logger = jsonEvent[@"logger"];
        event.tags = [SentryNativeHelper sanitizeDictionary:jsonEvent[@"tags"]];
        event.extra = jsonEvent[@"extra"];
        event.user = [SentryNativeHelper createUser:jsonEvent[@"user"]];
        if (jsonEvent[@"exception"]) {
            NSDictionary *exception = jsonEvent[@"exception"][@"values"][0];
            NSMutableArray *frames = [NSMutableArray array];
            NSArray<SentryFrame *> *stacktrace = [SentryNativeHelper convertReactNativeStacktrace:
                                                  [SentryNativeHelper parseRavenFrames:exception[@"stacktrace"][@"frames"]]];
            for (NSInteger i = (stacktrace.count-1); i >= 0; i--) {
                [frames addObject:[stacktrace objectAtIndex:i]];
            }
            [SentryNativeHelper addExceptionToEvent:event type:exception[@"type"] value:exception[@"value"] frames:frames];
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
        NSDictionary *breadcrumb = [command.arguments objectAtIndex:0];
        SentryBreadcrumb *crumb = [[SentryBreadcrumb alloc] initWithLevel:[SentryNativeHelper sentrySeverityFromLevel:breadcrumb[@"level"]]
                                                                 category:breadcrumb[@"category"]];
        crumb.message = breadcrumb[@"message"];
        crumb.timestamp = [NSDate dateWithTimeIntervalSince1970:[breadcrumb[@"timestamp"] integerValue]];
        crumb.type = breadcrumb[@"type"];
        crumb.data = breadcrumb[@"data"];
        [SentryClient.sharedClient.breadcrumbs addBreadcrumb:crumb];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[crumb serialize]];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

@end
