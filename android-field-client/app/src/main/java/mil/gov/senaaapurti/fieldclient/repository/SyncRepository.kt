package mil.gov.senaaapurti.fieldclient.repository

import kotlinx.coroutines.flow.Flow
import mil.gov.senaaapurti.fieldclient.data.local.dao.SyncOutboxDao
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity

class SyncRepository(private val syncOutboxDao: SyncOutboxDao) {

    val allOutboxItems: Flow<List<SyncOutboxQueueEntity>> =
        syncOutboxDao.getAllOutboxItems()

    val pendingCount: Flow<Int> =
        syncOutboxDao.getPendingCountFlow()

    suspend fun getPendingCount(): Int {
        return syncOutboxDao.getPendingCount()
    }

    suspend fun pruneOldSynced(olderThanDays: Int = 7) {
        val cutoff = System.currentTimeMillis() - (olderThanDays * 24 * 60 * 60 * 1000L)
        syncOutboxDao.pruneOldSynced(cutoff)
    }
}
