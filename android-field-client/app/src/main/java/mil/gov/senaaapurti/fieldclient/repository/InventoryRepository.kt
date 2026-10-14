package mil.gov.senaaapurti.fieldclient.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import mil.gov.senaaapurti.fieldclient.data.local.dao.InventoryDao
import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity
import mil.gov.senaaapurti.fieldclient.data.model.InventoryItem

class InventoryRepository(private val inventoryDao: InventoryDao) {

    val allInventoryItems: Flow<List<InventoryItem>> =
        inventoryDao.getAllInventoryItems().map { list -> list.map { it.toDomainModel() } }

    fun getItemsByCategory(category: String): Flow<List<InventoryItem>> {
        return if (category == "ALL") {
            allInventoryItems
        } else {
            inventoryDao.getItemsByCategory(category).map { list -> list.map { it.toDomainModel() } }
        }
    }

    fun searchItems(query: String): Flow<List<InventoryItem>> {
        return inventoryDao.searchItems(query).map { list -> list.map { it.toDomainModel() } }
    }

    suspend fun getItemBySku(sku: String): InventoryItem? {
        return inventoryDao.getItemBySku(sku)?.toDomainModel()
    }

    suspend fun getItemByBarcode(barcode: String): InventoryItem? {
        return inventoryDao.getItemByBarcode(barcode)?.toDomainModel()
    }

    suspend fun adjustStock(sku: String, delta: Int) {
        inventoryDao.adjustStock(sku, delta)
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
}
