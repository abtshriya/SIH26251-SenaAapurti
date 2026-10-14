package mil.gov.senaaapurti.fieldclient.data.model

sealed class ScanVerificationResult {
    data class Verified(
        val item: InventoryItem,
        val scannedBarcode: String,
        val delta: Int,
        val message: String = "ITEM VERIFIED - MATCHES VOUCHER"
    ) : ScanVerificationResult()

    data class Mismatch(
        val item: InventoryItem,
        val scannedBarcode: String,
        val expectedQty: Int,
        val scannedQty: Int,
        val message: String = "STOCK MISMATCH - QTY DISCREPANCY"
    ) : ScanVerificationResult()

    data class Unregistered(
        val scannedBarcode: String,
        val message: String = "UNREGISTERED SKU - REQUIRES MANUAL TAGGING"
    ) : ScanVerificationResult()
}
