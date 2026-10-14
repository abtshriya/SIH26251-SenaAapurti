package mil.gov.senaaapurti.fieldclient.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "local_inventory_items",
    indices = [
        Index(value = ["barcode"], unique = false),
        Index(value = ["category"])
    ]
)
data class InventoryItemEntity(
    @PrimaryKey
    @ColumnInfo(name = "sku")
    val sku: String,

    @ColumnInfo(name = "barcode")
    val barcode: String,

    @ColumnInfo(name = "item_name")
    val itemName: String,

    @ColumnInfo(name = "category")
    val category: String, // MUNITIONS, RATIONS, POL, MEDICAL, SPARES

    @ColumnInfo(name = "unit_of_measure")
    val unitOfMeasure: String,

    @ColumnInfo(name = "current_stock")
    val currentStock: Int,

    @ColumnInfo(name = "critical_threshold")
    val criticalThreshold: Int,

    @ColumnInfo(name = "bin_location")
    val binLocation: String,

    @ColumnInfo(name = "daily_burn_rate")
    val dailyBurnRate: Float = 0f,

    @ColumnInfo(name = "last_updated_timestamp")
    val lastUpdatedTimestamp: Long = System.currentTimeMillis()
)
