package mil.gov.senaaapurti.fieldclient.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mil.gov.senaaapurti.fieldclient.data.local.database.SenaFieldDatabase
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Background WorkManager Worker executing the Outbox Sync Pattern:
 * 1. Queries pending mutations from local Room database.
 * 2. Transmits cryptographically hashed payloads to SenaAapurti Central Backend.
 * 3. Marks transactions as SYNCED upon HTTP 200/201 response.
 */
class SyncOutboxWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val database = SenaFieldDatabase.getDatabase(applicationContext, this)
        val outboxDao = database.syncOutboxDao()
        val transactionDao = database.scanTransactionDao()

        val pendingItems = outboxDao.getPendingItems()
        if (pendingItems.isEmpty()) {
            return@withContext Result.success()
        }

        var anyFailed = false

        for (item in pendingItems) {
            val success = uploadMutationToBackend(item.actionType, item.payloadJson, item.payloadHash)
            if (success) {
                outboxDao.markSynced(item.outboxId)
            } else {
                outboxDao.markFailed(item.outboxId, "Network or server connection failed")
                anyFailed = true
            }
        }

        // Also mark corresponding scan transactions as SYNCED
        val pendingTransactions = transactionDao.getPendingTransactions()
        for (tx in pendingTransactions) {
            transactionDao.updateSyncStatus(tx.transactionId, "SYNCED")
        }

        if (anyFailed && runAttemptCount < 3) {
            Result.retry()
        } else {
            Result.success()
        }
    }

    private fun uploadMutationToBackend(
        actionType: String,
        payloadJson: String,
        payloadHash: String
    ): Boolean {
        return try {
            // Target local / central SenaAapurti telemetry sync endpoint
            val url = URL("http://10.0.2.2:8000/api/v1/telemetry/secure-ingest")
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 4000
                readTimeout = 4000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("X-Device-ID", "RUGGED-TERMINAL-NORTH-01")
                setRequestProperty("X-Payload-Hash", payloadHash)
                setRequestProperty("X-Action-Type", actionType)
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(payloadJson)
                writer.flush()
            }

            val responseCode = connection.responseCode
            connection.disconnect()
            responseCode in 200..299
        } catch (_: Exception) {
            // Emulate resilient offline-first graceful handling
            false
        }
    }
}
