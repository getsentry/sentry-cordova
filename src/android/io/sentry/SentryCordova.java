package io.sentry;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;

import java.util.Date;

import io.sentry.android.AndroidSentryClientFactory;

public class SentryCordova extends CordovaPlugin {
  private static final String TAG = "Sentry";

  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);
    Log.d(TAG, "Initializing Sentry");
  }

  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
    if(action.equals("install")) {
      String dsn = args.getString(0);
      Sentry.init(dsn, new AndroidSentryClientFactory(this.cordova.getActivity().getApplicationContext()));
      // We need to return false here to not create the captureBreadcrumb hook
      callbackContext.sendPluginResult(new PluginResult(Status.OK, false));
    } else {
      callbackContext.sendPluginResult(new PluginResult(Status.ERROR, "not implemented"));
    }
    return true;
  }

}
