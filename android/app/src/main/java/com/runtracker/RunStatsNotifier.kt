package com.runtracker

import android.content.Intent
import android.os.Build
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class RunStatsNotifier(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "RunStatsNotifier"

  @ReactMethod
  fun show(text: String) {
    val ctx = reactApplicationContext
    val intent =
      Intent(ctx, RunStatsService::class.java)
        .setAction(RunStatsService.ACTION_SHOW)
        .putExtra(RunStatsService.EXTRA_TEXT, text)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ctx.startForegroundService(intent)
    } else {
      ctx.startService(intent)
    }
  }

  @ReactMethod
  fun hide() {
    reactApplicationContext.stopService(
      Intent(reactApplicationContext, RunStatsService::class.java),
    )
  }
}

class RunStatsNotifierPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(RunStatsNotifier(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
