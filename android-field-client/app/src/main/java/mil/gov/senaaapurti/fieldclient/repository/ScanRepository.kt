package mil.gov.senaaapurti.fieldclient.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import mil.gov.senaaapurti.fieldclient.data.local.dao.InventoryDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.ScanTransactionDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.SyncOutboxDao
import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.ScanTransactionEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity
import mil.gov.senaaapurti.fieldclient.data.model.InventoryItem
import mil.gov.senaaapurti.fieldclient.data.model.ScanTransaction
import mil.gov.senaaapurti.fieldclient.data.model.ScanType
import mil.gov.senaaapurti.fieldclient.data.model.ScanVerificationResult
import mil.gov.senaaapurti.fieldclient.data.model.SyncStatus
import mil.gov.senaaapurti.fieldclient.data.model.VerificationStatus
import java.security.MessageDigest
import java.util.UUID

class ScanRepository(
    private val inventoryDao: InventoryDao,
    private val scanTransactionDao: ScanTransactionDao,
    private val syncOutboxDao: SyncOutboxDao
) {

    val recentTransactions: Flow<List<ScanTransaction>> =
        scanTransactionDao.getRecentTransactions().map { list -> list.map { it.toDomainModel() } }

    val pendingCount: Flow<Int> = scanTransactionDao.getPendingCountFlow()

    suspend fun processScan(
        scannedCode: String,
        scanType: ScanType,
        quantity: Int = 1,
        actorServiceNo: String = "IC-71044-OP"
    ): ScanVerificationResult {
        val trimmedCode = scannedCode.trim()

        // 1. Resolve item from local Room cache by barcode or SKU
        val matchedEntity = inventoryDao.getItemByBarcode(trimmedCode)
            ?: inventoryDao.getItemBySku(trimmedCode)

        val txId = "TX-" + UUID.randomUUID().toString().take(12).uppercase()
        val now = System.currentTimeMillis()

        if (matchedEntity == null) {
            // Unregistered item
            val tx = ScanTransactionEntity(
                transactionId = txId,
                sku = "UNKNOWN",
                barcode = trimmedCode,
                scanType = scanType.name,
                quantityDelta = quantity,
                verificationStatus = VerificationStatus.UNREGISTERED.name,
                actorServiceNo = actorServiceNo,
                notes = "Unregistered tag detected in field",
                timestamp = now,
                syncStatus = "PENDING"
            )
            scanTransactionDao.insertTransaction(tx)
            enqueueOutbox("UNREGISTERED_TAG_SCAN", buildPayloadJson(tx))

            return ScanVerificationResult.Unregistered(
                scannedBarcode = trimmedCode
            )
        }

        val domainItem = matchedEntity.toDomainModel()

        // 2. Determine verification status
        val verificationStatus = if (quantity <= 0) {
            VerificationStatus.MISMATCH
        } else {
            VerificationStatus.VERIFIED
        }

        // 3. Compute stock adjustment delta
        val delta = when (scanType) {
            ScanType.INWARD_RECEIPT -> quantity
            ScanType.DISPATCH_VERIFY -> -quantity
            ScanType.PHYSICAL_AUDIT -> 0 // Audit logs discrepancy without auto-delta until verified
        }

        if (delta != 0) {
            inventoryDao.adjustStock(domainItem.sku, delta, now)
        }

        // 4. Record Scan Transaction
        val tx = ScanTransactionEntity(
            transactionId = txId,
            sku = domainItem.sku,
            barcode = domainItem.barcode,
            scanType = scanType.name,
            quantityDelta = delta,
            verificationStatus = verificationStatus.name,
            actorServiceNo = actorServiceNo,
            notes = "Terminal scan at ${domainItem.binLocation}",
            timestamp = now,
            syncStatus = "PENDING"
        )
        scanTransactionDao.insertTransaction(tx)

        // 5. Enqueue Cryptographic Outbox Mutation
        val payload = buildPayloadJson(tx)
        enqueueOutbox(scanType.name, payload)

        return if (verificationStatus == VerificationStatus.VERIFIED) {
            ScanVerificationResult.Verified(
                item = domainItem,
                scannedBarcode = trimmedCode,
                delta = delta
            )
        } else {
            ScanVerificationResult.Mismatch(
                item = domainItem,
                scannedBarcode = trimmedCode,
                expectedQty = 1,
                scannedQty = quantity
            )
        }
    }

    private suspend fun enqueueOutbox(actionType: String, payloadJson: String) {
        val hash = sha256(payloadJson)
        val outbox = SyncOutboxQueueEntity(
            actionType = actionType,
            payloadJson = payloadJson,
            payloadHash = hash,
            status = "PENDING"
        )
        syncOutboxDao.enqueue(outbox)
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun buildPayloadJson(tx: ScanTransactionEntity): String {
        return """
            {
                "transaction_id": "${tx.transactionId}",
                "sku": "${tx.sku}",
                "barcode": "${tx.barcode}",
                "action": "${tx.scanType}",
                "quantity_delta": ${tx.quantityDelta},
                "status": "${tx.verificationStatus}",
                "actor_id": "${tx.actorServiceNo}",
                "timestamp": ${tx.timestamp}
            }
        """.trimIndent()
    }

    private fun InventoryItemEntity.toDomainModel(): InventoryItem {
        return InventoryItem(
            sku = sku,
            barcode = barcode,
            itemName = itemName,
            category = category,
            unitOfMeasure = unitOfMeasure,
            currentStock = currentStock,
            criticalThreshold = criticalThreshold,
            binLocation = binLocation,
            dailyBurnRate = dailyBurnRate,
            lastUpdatedTimestamp = lastUpdatedTimestamp
        )
    }

    private fun ScanTransactionEntity.toDomainModel(): ScanTransaction {
        return ScanTransaction(
            transactionId = transactionId,
            sku = sku,
            barcode = barcode,
            scanType = ScanType.valueOf(scanType),
            quantityDelta = quantityDelta,
            verificationStatus = VerificationStatus.valueOf(verificationStatus),
            actorServiceNo = actorServiceNo,
            notes = notes,
            timestamp = timestamp,
            syncStatus = SyncStatus.valueOf(syncStatus)
        )
    }
}
