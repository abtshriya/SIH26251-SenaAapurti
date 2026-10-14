package mil.gov.senaaapurti.fieldclient.data.model

data class ScanTransaction(
    val transactionId: String,
    val sku: String,
    val barcode: String,
    val scanType: ScanType,
    val quantityDelta: Int,
    val verificationStatus: VerificationStatus,
    val actorServiceNo: String,
    val notes: String,
    val timestamp: Long,
    val syncStatus: SyncStatus
)

enum class ScanType {
    INWARD_RECEIPT,
    DISPATCH_VERIFY,
    PHYSICAL_AUDIT
}

enum class VerificationStatus {
    VERIFIED,
    MISMATCH,
    UNREGISTERED
}

enum class SyncStatus {
    PENDING,
    IN_FLIGHT,
    SYNCED,
    FAILED
}
