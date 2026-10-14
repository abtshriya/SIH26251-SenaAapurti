package mil.gov.senaaapurti.fieldclient.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "scan_transactions",
    indices = [
        Index(value = ["sku"]),
        Index(value = ["timestamp"]),
        Index(value = ["sync_status"])
    ]
)
data class ScanTransactionEntity(
    @PrimaryKey
    @ColumnInfo(name = "transaction_id")
    val transactionId: String,

    @ColumnInfo(name = "sku")
    val sku: String,

    @ColumnInfo(name = "barcode")
    val barcode: String,

    @ColumnInfo(name = "scan_type")
    val scanType: String, // INWARD_RECEIPT, DISPATCH_VERIFY, PHYSICAL_AUDIT

    @ColumnInfo(name = "quantity_delta")
    val quantityDelta: Int,

    @ColumnInfo(name = "verification_status")
    val verificationStatus: String, // VERIFIED, MISMATCH, UNREGISTERED

    @ColumnInfo(name = "actor_service_no")
    val actorServiceNo: String = "IC-71044-OP",

    @ColumnInfo(name = "notes")
    val notes: String = "",

    @ColumnInfo(name = "timestamp")
    val timestamp: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "PENDING" // PENDING, SYNCED, FAILED
)
