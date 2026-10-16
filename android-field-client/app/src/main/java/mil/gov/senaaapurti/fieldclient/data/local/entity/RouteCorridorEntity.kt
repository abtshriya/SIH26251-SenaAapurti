package mil.gov.senaaapurti.fieldclient.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "route_corridors")
data class RouteCorridorEntity(
    @PrimaryKey
    @ColumnInfo(name = "corridor_id")
    val corridorId: String,

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "pass_name")
    val passName: String,

    @ColumnInfo(name = "altitude_ft")
    val altitudeFt: Int,

    @ColumnInfo(name = "status")
    val status: String, // OPEN, CHAINS_REQUIRED, BLIZZARD_ALERT, AVALANCHE_CLOSED

    @ColumnInfo(name = "temperature_c")
    val temperatureC: Int,

    @ColumnInfo(name = "active_warning")
    val activeWarning: String,

    @ColumnInfo(name = "alternate_route")
    val alternateRoute: String,

    @ColumnInfo(name = "clearance_unit")
    val clearanceUnit: String
)
