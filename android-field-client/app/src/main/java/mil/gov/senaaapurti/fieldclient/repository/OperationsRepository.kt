package mil.gov.senaaapurti.fieldclient.repository

import kotlinx.coroutines.flow.Flow
import mil.gov.senaaapurti.fieldclient.data.local.dao.OperationsDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.SyncOutboxDao
import mil.gov.senaaapurti.fieldclient.data.local.entity.ConvoyEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.IndentEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.RouteCorridorEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity
import java.security.MessageDigest
import java.util.UUID

class OperationsRepository(
    private val operationsDao: OperationsDao,
    private val syncOutboxDao: SyncOutboxDao
) {
    val allConvoys: Flow<List<ConvoyEntity>> = operationsDao.getAllConvoys()
    val allIndents: Flow<List<IndentEntity>> = operationsDao.getAllIndents()
    val allCorridors: Flow<List<RouteCorridorEntity>> = operationsDao.getAllCorridors()

    suspend fun rerouteConvoy(convoyId: String, newRoute: String, reason: String) {
        operationsDao.rerouteConvoy(
            convoyId = convoyId,
            newStatus = "DIVERTED",
            newRoute = newRoute,
            hazard = reason
        )

        // Log mutation in Outbox with cryptographic SHA-256
        val payload = """{"convoy_id":"$convoyId","new_route":"$newRoute","reason":"$reason","action":"EMERGENCY_REROUTE"}"""
        val hash = sha256(payload)
        syncOutboxDao.enqueue(
            SyncOutboxQueueEntity(
                actionType = "CONVOY_REROUTE",
                payloadJson = payload,
                payloadHash = hash
            )
        )
    }

    suspend fun createIndent(
        sku: String,
        itemName: String,
        category: String,
        quantity: Int,
        unitOfMeasure: String,
        priority: String,
        justification: String
    ): IndentEntity {
        val indentId = "IND-2026-10-" + (100..999).random()
        val payload = """{"indent_id":"$indentId","sku":"$sku","item_name":"$itemName","quantity":$quantity,"priority":"$priority","justification":"$justification"}"""
        val hash = sha256(payload)

        val indent = IndentEntity(
            indentId = indentId,
            sku = sku,
            itemName = itemName,
            category = category,
            quantityRequested = quantity,
            unitOfMeasure = unitOfMeasure,
            priority = priority,
            justification = justification,
            status = "SUBMITTED",
            authorizingOfficer = "Lt. Col. R. Rathore, QM",
            createdAt = System.currentTimeMillis(),
            hash = hash
        )

        operationsDao.insertIndent(indent)

        // Queue in cryptographic outbox
        syncOutboxDao.enqueue(
            SyncOutboxQueueEntity(
                actionType = "EMERGENCY_INDENT",
                payloadJson = payload,
                payloadHash = hash
            )
        )

        return indent
    }

    suspend fun authorizeWinterBuffer(category: String, targetSector: String): String {
        val authCode = "WINT-AUTH-" + UUID.randomUUID().toString().take(8).uppercase()
        val payload = """{"auth_code":"$authCode","category":"$category","sector":"$targetSector","status":"BUFFER_DISPATCH_AUTHORIZED","timestamp":${System.currentTimeMillis()}}"""
        val hash = sha256(payload)

        syncOutboxDao.enqueue(
            SyncOutboxQueueEntity(
                actionType = "PRE_WINTER_BUFFER_DISPATCH",
                payloadJson = payload,
                payloadHash = hash
            )
        )

        return authCode
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
