package mil.gov.senaaapurti.fieldclient.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity

@Dao
interface SyncOutboxDao {
    @Query("SELECT * FROM sync_outbox_queue ORDER BY created_at DESC")
    fun getAllOutboxItems(): Flow<List<SyncOutboxQueueEntity>>

    @Query("SELECT * FROM sync_outbox_queue WHERE status = 'PENDING' ORDER BY created_at ASC")
    suspend fun getPendingItems(): List<SyncOutboxQueueEntity>

    @Query("SELECT COUNT(*) FROM sync_outbox_queue WHERE status = 'PENDING'")
    fun getPendingCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM sync_outbox_queue WHERE status = 'PENDING'")
    suspend fun getPendingCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(item: SyncOutboxQueueEntity): Long

    @Update
    suspend fun update(item: SyncOutboxQueueEntity)

    @Query("UPDATE sync_outbox_queue SET status = 'SYNCED', synced_at = :syncedAt WHERE outbox_id = :id")
    suspend fun markSynced(id: Long, syncedAt: Long = System.currentTimeMillis())

    @Query("UPDATE sync_outbox_queue SET status = 'FAILED', retry_count = retry_count + 1, error_message = :error WHERE outbox_id = :id")
    suspend fun markFailed(id: Long, error: String)

    @Query("DELETE FROM sync_outbox_queue WHERE status = 'SYNCED' AND synced_at < :olderThan")
    suspend fun pruneOldSynced(olderThan: Long)
}
