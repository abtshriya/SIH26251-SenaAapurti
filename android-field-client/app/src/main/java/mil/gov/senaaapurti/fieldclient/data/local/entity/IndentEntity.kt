package mil.gov.senaaapurti.fieldclient.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "unit_indents")
data class IndentEntity(
    @PrimaryKey
    @ColumnInfo(name = "indent_id")
    val indentId: String,

    @ColumnInfo(name = "sku")
    val sku: String,

    @ColumnInfo(name = "item_name")
    val itemName: String,

    @ColumnInfo(name = "category")
    val category: String,

    @ColumnInfo(name = "quantity_requested")
    val quantityRequested: Int,

    @ColumnInfo(name = "unit_of_measure")
    val unitOfMeasure: String,

    @ColumnInfo(name = "priority")
    val priority: String, // EMERGENCY, URGENT, ROUTINE

    @ColumnInfo(name = "justification")
    val justification: String,

    @ColumnInfo(name = "status")
    val status: String, // SUBMITTED, APPROVED, DISPATCHED, DELIVERED

    @ColumnInfo(name = "authorizing_officer")
    val authorizingOfficer: String = "Lt. Col. R. Rathore, QM",

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "hash")
    val hash: String = ""
)
