package mil.gov.senaaapurti.fieldclient.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow
import mil.gov.senaaapurti.fieldclient.data.local.entity.ConvoyEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.IndentEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.RouteCorridorEntity

@Dao
interface OperationsDao {

    // Convoys
    @Query("SELECT * FROM convoys ORDER BY convoy_id ASC")
    fun getAllConvoys(): Flow<List<ConvoyEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConvoys(convoys: List<ConvoyEntity>)

    @Query("UPDATE convoys SET status = :newStatus, route_name = :newRoute, hazard_warning = :hazard WHERE convoy_id = :convoyId")
    suspend fun rerouteConvoy(convoyId: String, newStatus: String, newRoute: String, hazard: String)

    // Indents
    @Query("SELECT * FROM unit_indents ORDER BY created_at DESC")
    fun getAllIndents(): Flow<List<IndentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIndent(indent: IndentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIndents(indents: List<IndentEntity>)

    @Query("SELECT COUNT(*) FROM unit_indents")
    suspend fun getIndentCount(): Int

    // Route Corridors
    @Query("SELECT * FROM route_corridors")
    fun getAllCorridors(): Flow<List<RouteCorridorEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCorridors(corridors: List<RouteCorridorEntity>)

    @Query("UPDATE route_corridors SET status = :status, active_warning = :warning WHERE corridor_id = :corridorId")
    suspend fun updateCorridorStatus(corridorId: String, status: String, warning: String)
}
