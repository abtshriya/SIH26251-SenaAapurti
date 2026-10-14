package mil.gov.senaaapurti.fieldclient.hardware

import android.content.Context
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.KeyEvent
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Dedicated Hardware Driver & Trigger Manager for Ruggedized Military Handhelds
 * (Zebra TC57/TC77, Honeywell Dolphin, Urovo DT50, BEL Tactical Tablets).
 */
class RuggedScannerHardwareManager(private val context: Context) {

    private val _hardwareScanTrigger = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val hardwareScanTrigger = _hardwareScanTrigger.asSharedFlow()

    private var toneGenerator: ToneGenerator? = null
    private var isTorchOn = false

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100)
        } catch (_: Exception) {
            toneGenerator = null
        }
    }

    /**
     * Inspects incoming hardware KeyEvent from Android Activity.
     * Returns true if the key represents a dedicated physical yellow/orange side scan button.
     */
    fun handleKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_BUTTON_R1,
            KeyEvent.KEYCODE_BUTTON_L1,
            KEY_ZEBRA_SCAN,
            KEY_HONEYWELL_SCAN,
            KEY_UROVO_SCAN,
            KeyEvent.KEYCODE_VOLUME_DOWN -> {
                _hardwareScanTrigger.tryEmit(Unit)
                true
            }
            else -> false
        }
    }

    /**
     * Tactile & Audio feedback for Successful Item Verification
     */
    fun notifySuccess() {
        toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 120)
        vibrate(shortDuration = 50L)
    }

    /**
     * Tactile & Audio feedback for Discrepancy / Mismatch
     */
    fun notifyWarning() {
        toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP2, 250)
        vibrate(shortDuration = 150L, repeat = 2)
    }

    /**
     * Tactile & Audio feedback for Unregistered SKU
     */
    fun notifyError() {
        toneGenerator?.startTone(ToneGenerator.TONE_PROP_NACK, 350)
        vibrate(shortDuration = 300L, repeat = 3)
    }

    /**
     * Quick-toggle Tactical Flashlight for dark depot aisles and night operations.
     */
    fun toggleTacticalTorch(): Boolean {
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            ?: return false
        try {
            for (cameraId in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(cameraId)
                val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
                if (hasFlash) {
                    isTorchOn = !isTorchOn
                    cameraManager.setTorchMode(cameraId, isTorchOn)
                    return isTorchOn
                }
            }
        } catch (_: CameraAccessException) {
            // Flash not accessible or in use by camera viewfinder
        }
        return false
    }

    private fun vibrate(shortDuration: Long, repeat: Int = 1) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                manager?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (repeat > 1) {
                        val timings = longArrayOf(0, shortDuration, 60L, shortDuration)
                        vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
                    } else {
                        vibrator.vibrate(
                            VibrationEffect.createOneShot(
                                shortDuration,
                                VibrationEffect.DEFAULT_AMPLITUDE
                            )
                        )
                    }
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(shortDuration)
                }
            }
        } catch (_: Exception) {
            // Vibration permission handled gracefully
        }
    }

    companion object {
        // Known Vendor Specific KeyCodes on Rugged Handhelds
        private const val KEY_ZEBRA_SCAN = 293
        private const val KEY_HONEYWELL_SCAN = 294
        private const val KEY_UROVO_SCAN = 296
    }
}
