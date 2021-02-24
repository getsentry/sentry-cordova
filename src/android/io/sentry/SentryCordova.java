package io.sentry;

import java.util.Date;
import java.util.List;
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

  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
    switch (action) {
    case "startWithOptions":
      JSONObject jsonOptions = args.getJSONObject(0);

      startWithOptions(jsonOptions, callbackContext);

      break;
    default:
      callbackContext.sendPluginResult(new PluginResult(Status.ERROR, "not implemented"));
      break;
    }

    return true;
  }

  private void startWithOptions(final JSONObject jsonOptions, final CallbackContext callbackContext) {
    SentryAndroid.init(this.cordova.getActivity().getApplicationContext(), options -> {
      try {
        withJsonOptions(jsonOptions, options);
        logger.info(String.format("Native Integrations '%s'", options.getIntegrations().toString()));
        sentryOptions = options;
      } catch (JSONException e) {
        logger.error("Error parsing options JSON sent over native bridge.");
        callbackContext.sendPluginResult(new PluginResult(Status.ERROR, false));
      }
    });

    callbackContext.sendPluginResult(new PluginResult(Status.OK, true));
  }

  private void withJsonOptions(final JSONObject jsonOptions, SentryOptions options) throws JSONException {
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
  }
}
