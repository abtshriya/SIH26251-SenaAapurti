package mil.gov.senaaapurti.fieldclient.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sync_outbox_queue",
    indices = [
        Index(value = ["status"]),
        Index(value = ["created_at"])
    ]
)
data class SyncOutboxQueueEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "outbox_id")
    val outboxId: Long = 0,

    @ColumnInfo(name = "action_type")
    val actionType: String, // INWARD_SCAN, OUTWARD_DISPATCH, STOCK_AUDIT, TELEMETRY_SYNC

    @ColumnInfo(name = "payload_json")
    val payloadJson: String,

    @ColumnInfo(name = "payload_hash")
    val payloadHash: String, // SHA-256 tamper-proof ledger hash

    @ColumnInfo(name = "status")
    val status: String = "PENDING", // PENDING, IN_FLIGHT, SYNCED, FAILED

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "synced_at")
    val syncedAt: Long? = null,

    @ColumnInfo(name = "error_message")
    val errorMessage: String? = null
)
