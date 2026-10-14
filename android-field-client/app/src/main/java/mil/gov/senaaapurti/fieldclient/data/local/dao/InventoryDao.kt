package mil.gov.senaaapurti.fieldclient.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow
import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity

@Dao
interface InventoryDao {
    @Query("SELECT * FROM local_inventory_items ORDER BY category ASC, item_name ASC")
    fun getAllInventoryItems(): Flow<List<InventoryItemEntity>>

    @Query("SELECT * FROM local_inventory_items WHERE category = :category ORDER BY item_name ASC")
    fun getItemsByCategory(category: String): Flow<List<InventoryItemEntity>>

    @Query("SELECT * FROM local_inventory_items WHERE sku = :sku LIMIT 1")
    suspend fun getItemBySku(sku: String): InventoryItemEntity?

    @Query("SELECT * FROM local_inventory_items WHERE barcode = :barcode LIMIT 1")
    suspend fun getItemByBarcode(barcode: String): InventoryItemEntity?

    @Query("""
        SELECT * FROM local_inventory_items 
        WHERE item_name LIKE '%' || :query || '%' 
           OR sku LIKE '%' || :query || '%' 
           OR barcode LIKE '%' || :query || '%'
        ORDER BY item_name ASC
    """)
    fun searchItems(query: String): Flow<List<InventoryItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(item: InventoryItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<InventoryItemEntity>)

    @Update
    suspend fun update(item: InventoryItemEntity)

    @Query("UPDATE local_inventory_items SET current_stock = current_stock + :delta, last_updated_timestamp = :timestamp WHERE sku = :sku")
    suspend fun adjustStock(sku: String, delta: Int, timestamp: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM local_inventory_items")
    suspend fun getItemCount(): Int
}
