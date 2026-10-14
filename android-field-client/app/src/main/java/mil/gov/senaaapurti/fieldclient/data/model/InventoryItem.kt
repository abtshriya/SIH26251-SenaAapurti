package mil.gov.senaaapurti.fieldclient.data.model

data class InventoryItem(
    val sku: String,
    val barcode: String,
    val itemName: String,
    val category: String,
    val unitOfMeasure: String,
    val currentStock: Int,
    val criticalThreshold: Int,
    val binLocation: String,
    val dailyBurnRate: Float,
    val lastUpdatedTimestamp: Long
) {
    val isCriticalShortage: Boolean
        get() = currentStock < criticalThreshold

    val daysOfSupply: Float
        get() = if (dailyBurnRate > 0) currentStock / dailyBurnRate else 999f
}
