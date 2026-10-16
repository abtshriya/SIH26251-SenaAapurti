package mil.gov.senaaapurti.fieldclient

import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import mil.gov.senaaapurti.fieldclient.ui.navigation.AppNavigation
import mil.gov.senaaapurti.fieldclient.ui.theme.SenaFieldTheme

class MainActivity : ComponentActivity() {

    private val applicationInstance by lazy { application as SenaFieldApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            var isNightVisionMode by remember { mutableStateOf(false) }

            SenaFieldTheme(isNightVisionMode = isNightVisionMode) {
                AppNavigation(
                    inventoryRepository = applicationInstance.inventoryRepository,
                    scanRepository = applicationInstance.scanRepository,
                    syncRepository = applicationInstance.syncRepository,
                    operationsRepository = applicationInstance.operationsRepository,
                    syncManager = applicationInstance.syncManager,
                    hardwareManager = applicationInstance.hardwareManager,
                    isNightVisionMode = isNightVisionMode,
                    onToggleNightVision = { isNightVisionMode = !isNightVisionMode }
                )
            }
        }
    }

    /**
     * Intercepts physical yellow/orange trigger scan buttons on ruggedized Android terminals
     * (Zebra TC57/77, Honeywell Dolphin, Urovo, BEL Field Tablets).
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        val handled = applicationInstance.hardwareManager.handleKeyDown(keyCode, event)
        return if (handled) true else super.onKeyDown(keyCode, event)
    }
}
