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

import io.sentry.android.core.SentryAndroid;

public class SentryCordova extends CordovaPlugin {
  private static final String TAG = "Sentry";

  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);
    Log.d(TAG, "Initializing Sentry");
  }

  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
      switch(action) {
        case "startWithOptions":
          JSONObject jsonOptions = args.getJSONObject(0);
          
          String dsn = jsonOptions.getString("dsn");

          SentryAndroid.init(this.cordova.getActivity().getApplicationContext(), options -> {
            options.setDsn(dsn);
          });

          callbackContext.sendPluginResult(new PluginResult(Status.OK, true));
          break;
        default:
          callbackContext.sendPluginResult(new PluginResult(Status.ERROR, "not implemented"));
          break;
      }

      return true;
  }
}
