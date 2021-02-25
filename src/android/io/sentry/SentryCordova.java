package io.sentry;

import java.io.File;
import java.io.FileOutputStream;
import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;

import io.sentry.Sentry;
import io.sentry.UncaughtExceptionHandlerIntegration;
import io.sentry.android.core.AnrIntegration;
import io.sentry.android.core.NdkIntegration;
import io.sentry.android.core.SentryAndroid;

public class SentryCordova extends CordovaPlugin {
  private static final String TAG = "Sentry";

  final static Logger logger = Logger.getLogger("sentry-cordova");

  private SentryOptions sentryOptions;

  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);
    Log.d(TAG, "Initializing Sentry");
  }

  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) {
    // Special case for crash
    if (action.equals("crash")) {
      crash();
      return true;
    }

    try {
      switch (action) {
      case "startWithOptions":
        JSONObject jsonOptions = args.getJSONObject(0);

        startWithOptions(jsonOptions, callbackContext);

        break;
      case "captureEnvelope":
        String envelope = args.getString(0);

        captureEnvelope(envelope, callbackContext);

        break;
      case "addBreadcrumb":
        JSONObject jsonBreadcrumb = args.getJSONObject(0);

        addBreadcrumb(jsonBreadcrumb, callbackContext);

        break;
      case "clearBreadcrumbs":
        clearBreadcrumbs(callbackContext);
        break;
      case "getStringBytesLength":
        String payload = args.getString(0);

        int length = getStringBytesLength(payload);

        callbackContext.sendPluginResult(new PluginResult(Status.OK, length));

        break;
      default:
        // callbackContext.sendPluginResult(new PluginResult(Status.ERROR, "not implemented"));
        break;
      }
    } catch (Exception e) {
      if (e instanceof JSONException) {
        logger.info("Error parsing JSON from native bridge");
      }

      callbackContext.sendPluginResult(new PluginResult(Status.ERROR, false));

      return false;
    }

    return true;
  }

  private void startWithOptions(final JSONObject jsonOptions, final CallbackContext callbackContext) {
    SentryAndroid.init(this.cordova.getActivity().getApplicationContext(), options -> {
      try {
        if (jsonOptions.has("dsn") && jsonOptions.getString("dsn") != null) {
          String dsn = jsonOptions.getString("dsn");
          logger.info(String.format("Starting with DSN: '%s'", dsn));
          options.setDsn(dsn);
        } else {
          // SentryAndroid needs an empty string fallback for the dsn.
          options.setDsn("");
        }
        if (jsonOptions.has("debug") && jsonOptions.getBoolean("debug")) {
          options.setDebug(true);
        }
        if (jsonOptions.has("maxBreadcrumbs")) {
          options.setMaxBreadcrumbs(jsonOptions.getInt("maxBreadcrumbs"));
        }
        if (jsonOptions.has("environment") && jsonOptions.getString("environment") != null) {
          options.setEnvironment(jsonOptions.getString("environment"));
        }
        if (jsonOptions.has("release") && jsonOptions.getString("release") != null) {
          options.setRelease(jsonOptions.getString("release"));
        }
        if (jsonOptions.has("dist") && jsonOptions.getString("dist") != null) {
          options.setDist(jsonOptions.getString("dist"));
        }
        if (jsonOptions.has("enableAutoSessionTracking")) {
          options.setEnableSessionTracking(jsonOptions.getBoolean("enableAutoSessionTracking"));
        }
        if (jsonOptions.has("sessionTrackingIntervalMillis")) {
          options.setSessionTrackingIntervalMillis(jsonOptions.getInt("sessionTrackingIntervalMillis"));
        }
        if (jsonOptions.has("enableNdkScopeSync")) {
          options.setEnableScopeSync(jsonOptions.getBoolean("enableNdkScopeSync"));
        }
        if (jsonOptions.has("attachStacktrace")) {
          options.setAttachStacktrace(jsonOptions.getBoolean("attachStacktrace"));
        }
        if (jsonOptions.has("attachThreads")) {
          // JS use top level stacktraces and android attaches Threads which
          // hides them so by default we hide.
          options.setAttachThreads(jsonOptions.getBoolean("attachThreads"));
        }

        if (jsonOptions.has("enableNativeCrashHandling") && !jsonOptions.getBoolean("enableNativeCrashHandling")) {
          final List<Integration> integrations = options.getIntegrations();
          for (final Integration integration : integrations) {
            if (integration instanceof UncaughtExceptionHandlerIntegration || integration instanceof AnrIntegration || integration instanceof NdkIntegration) {
              integrations.remove(integration);
            }
          }
        }

        logger.info(String.format("Native Integrations '%s'", options.getIntegrations().toString()));
        sentryOptions = options;
      } catch (JSONException e) {
        logger.info("Error parsing options JSON sent over native bridge.");
        callbackContext.sendPluginResult(new PluginResult(Status.ERROR, false));
      }
    });

    callbackContext.sendPluginResult(new PluginResult(Status.OK, true));
  }

  private void captureEnvelope(String envelope, final CallbackContext callbackContext) {
    try {
      File installation = new File(sentryOptions.getOutboxPath(), UUID.randomUUID().toString());
      try (FileOutputStream out = new FileOutputStream(installation)) {
        out.write(envelope.getBytes(Charset.forName("UTF-8")));
      }
    } catch (Exception e) {
      logger.info("Error reading envelope");
      callbackContext.sendPluginResult(new PluginResult(Status.ERROR, false));
    }

    callbackContext.sendPluginResult(new PluginResult(Status.OK, true));
  }

  private void addBreadcrumb(final JSONObject jsonBreadcrumb, final CallbackContext callbackContext) {
    Sentry.configureScope(scope -> {
      try {
        Breadcrumb breadcrumb = new Breadcrumb();

        if (jsonBreadcrumb.has("message")) {
          breadcrumb.setMessage(jsonBreadcrumb.getString("message"));
        }

        if (jsonBreadcrumb.has("type")) {
          breadcrumb.setType(jsonBreadcrumb.getString("type"));
        }

        if (jsonBreadcrumb.has("category")) {
          breadcrumb.setCategory(jsonBreadcrumb.getString("category"));
        }

        if (jsonBreadcrumb.has("level")) {
          breadcrumb.setLevel(getSentryLevelFromString(jsonBreadcrumb.getString("level")));
        }

        if (jsonBreadcrumb.has("data")) {
          JSONObject data = jsonBreadcrumb.getJSONObject("data");
          Iterator<String> it = data.keys();
          while (it.hasNext()) {
            String key = it.next();
            String value = data.getString(key);

            breadcrumb.setData(key, value);
          }
        }

        scope.addBreadcrumb(breadcrumb);
        logger.info("Send breadcrumb successful");
      } catch (JSONException e) {
        logger.info("Error deserializing breadcrumb");
      }
    });
  }

  private void clearBreadcrumbs(final CallbackContext callbackContext) {
    Sentry.configureScope(scope -> { scope.clearBreadcrumbs(); });
    callbackContext.sendPluginResult(new PluginResult(Status.OK, true));
  }

  private int getStringBytesLength(String payload) throws UnsupportedEncodingException { return payload.getBytes("UTF-8").length; }

  private SentryLevel getSentryLevelFromString(String level) {
    switch (level) {
    case "fatal":
      return SentryLevel.FATAL;
    case "warning":
      return SentryLevel.WARNING;
    case "info":
      return SentryLevel.INFO;
    case "debug":
      return SentryLevel.DEBUG;
    case "error":
      return SentryLevel.ERROR;
    default:
      return SentryLevel.ERROR;
    }
  }

  private void crash() { Sentry.captureException(new RuntimeException("TEST - Sentry Client Crash (only works in release mode)")); }
}
