package mil.gov.senaaapurti.fieldclient.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "convoys")
data class ConvoyEntity(
    @PrimaryKey
    @ColumnInfo(name = "convoy_id")
    val convoyId: String,

    @ColumnInfo(name = "call_sign")
    val callSign: String,

    @ColumnInfo(name = "vehicle_count")
    val vehicleCount: Int,

    @ColumnInfo(name = "tonnage")
    val tonnage: Float,

    @ColumnInfo(name = "supply_class")
    val supplyClass: String, // Class I, Class III, Class V, Class VIII, Class IX

    @ColumnInfo(name = "origin")
    val origin: String,

    @ColumnInfo(name = "destination")
    val destination: String,

    @ColumnInfo(name = "route_name")
    val routeName: String,

    @ColumnInfo(name = "status")
    val status: String, // EN_ROUTE, STAGED, DIVERTED, DELIVERED

    @ColumnInfo(name = "eta")
    val eta: String,

    @ColumnInfo(name = "commander")
    val commander: String,

    @ColumnInfo(name = "hazard_warning")
    val hazardWarning: String = "",

    @ColumnInfo(name = "last_checkpoint")
    val lastCheckpoint: String = ""
)
