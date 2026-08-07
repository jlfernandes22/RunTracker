package com.runtracker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder

/**
 * Foreground service that keeps the recording session alive when the screen is
 * locked (replaces the unmaintained react-native-background-actions) and hosts
 * the live run-stats notification, which is visible on the lock screen.
 */
class RunStatsService : Service() {

  companion object {
    const val ACTION_SHOW = "com.runtracker.action.SHOW"
    const val EXTRA_TEXT = "text"
    private const val CHANNEL_ID = "run-progress"
    private const val NOTIF_ID = 1
  }

  private var started = false

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val text = intent?.getStringExtra(EXTRA_TEXT)
    if (text == null) {
      stopSelf()
      return START_NOT_STICKY
    }
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "Run in progress", NotificationManager.IMPORTANCE_DEFAULT)
        .apply { setShowBadge(false) },
    )
    val notification = buildNotification(text)
    if (!started) {
      startForegroundCompat(NOTIF_ID, notification)
      started = true
    } else {
      manager.notify(null, NOTIF_ID, notification)
    }
    return START_STICKY
  }

  private fun startForegroundCompat(id: Int, notification: Notification) {
    if (android.os.Build.VERSION.SDK_INT >= 29) {
      startForeground(id, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      startForeground(id, notification)
    }
  }

  private fun buildNotification(text: String): Notification {
    return Notification.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle("Run in progress")
      .setContentText(text)
      .setStyle(Notification.BigTextStyle().bigText(text))
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOnlyAlertOnce(true)
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_PROGRESS)
      .build()
  }

  override fun onDestroy() {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
    manager?.cancel(null, NOTIF_ID)
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
