package mil.gov.senaaapurti.fieldclient.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow
import mil.gov.senaaapurti.fieldclient.data.local.entity.ScanTransactionEntity

@Dao
interface ScanTransactionDao {
    @Query("SELECT * FROM scan_transactions ORDER BY timestamp DESC LIMIT 50")
    fun getRecentTransactions(): Flow<List<ScanTransactionEntity>>

    @Query("SELECT * FROM scan_transactions WHERE sync_status = 'PENDING' ORDER BY timestamp ASC")
    suspend fun getPendingTransactions(): List<ScanTransactionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: ScanTransactionEntity)

    @Query("UPDATE scan_transactions SET sync_status = :status WHERE transaction_id = :id")
    suspend fun updateSyncStatus(id: String, status: String)

    @Query("SELECT COUNT(*) FROM scan_transactions WHERE sync_status = 'PENDING'")
    fun getPendingCountFlow(): Flow<Int>
}
