package com.compleitapp

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Lets JS check and request the "Alarms & reminders" special access
 * (SCHEDULE_EXACT_ALARM). With it, expo-notifications schedules reminders as
 * exact alarms instead of inexact ones that Android may delay by up to an hour.
 */
class ExactAlarmModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun canScheduleExactAlarms(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      // Before Android 12 exact alarms need no permission.
      promise.resolve(true)
      return
    }
    try {
      val alarmManager =
        reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      promise.resolve(alarmManager.canScheduleExactAlarms())
    } catch (e: Exception) {
      promise.reject("E_EXACT_ALARM_CHECK", e.message, e)
    }
  }

  /** Opens this app's "Alarms & reminders" page; resolves false below Android 12. */
  @ReactMethod
  fun openSettings(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      promise.resolve(false)
      return
    }
    try {
      val context = reactApplicationContext
      val intent =
        Intent(
          Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
          Uri.parse("package:" + context.packageName),
        )
      val activity = context.currentActivity
      if (activity != null) {
        // Stays in the app's task, so Back returns to Compleit.
        activity.startActivity(intent)
      } else {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("E_EXACT_ALARM_SETTINGS", e.message, e)
    }
  }

  companion object {
    const val NAME = "ExactAlarm"
  }
}
