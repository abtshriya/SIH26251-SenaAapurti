package mil.gov.senaaapurti.fieldclient

import android.app.Application
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import mil.gov.senaaapurti.fieldclient.data.local.database.SenaFieldDatabase
import mil.gov.senaaapurti.fieldclient.hardware.RuggedScannerHardwareManager
import mil.gov.senaaapurti.fieldclient.repository.InventoryRepository
import mil.gov.senaaapurti.fieldclient.repository.ScanRepository
import mil.gov.senaaapurti.fieldclient.repository.SyncRepository
import mil.gov.senaaapurti.fieldclient.worker.SyncManager

class SenaFieldApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database by lazy { SenaFieldDatabase.getDatabase(this, applicationScope) }

    val inventoryRepository by lazy { InventoryRepository(database.inventoryDao()) }
    val scanRepository by lazy {
        ScanRepository(
            database.inventoryDao(),
            database.scanTransactionDao(),
            database.syncOutboxDao()
        )
    }
    val syncRepository by lazy { SyncRepository(database.syncOutboxDao()) }

    val syncManager by lazy { SyncManager(this) }
    val hardwareManager by lazy { RuggedScannerHardwareManager(this) }

    override fun onCreate() {
        super.onCreate()
        // Initialize periodic background WorkManager synchronization
        syncManager.schedulePeriodicBackgroundSync()
    }
}
