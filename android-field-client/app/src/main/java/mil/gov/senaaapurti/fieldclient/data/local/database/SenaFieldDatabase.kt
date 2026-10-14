package mil.gov.senaaapurti.fieldclient.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import mil.gov.senaaapurti.fieldclient.data.local.converters.Converters
import mil.gov.senaaapurti.fieldclient.data.local.dao.InventoryDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.ScanTransactionDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.SyncOutboxDao
import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.ScanTransactionEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity

@Database(
    entities = [
        InventoryItemEntity::class,
        ScanTransactionEntity::class,
        SyncOutboxQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class SenaFieldDatabase : RoomDatabase() {

    abstract fun inventoryDao(): InventoryDao
    abstract fun scanTransactionDao(): ScanTransactionDao
    abstract fun syncOutboxDao(): SyncOutboxDao

    companion object {
        @Volatile
        private var INSTANCE: SenaFieldDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): SenaFieldDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SenaFieldDatabase::class.java,
                    "sena_aapurti_field.db"
                )
                    .fallbackToDestructiveMigration()
                    .addCallback(DatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialDatabase(database.inventoryDao())
                    }
                }
            }

            suspend fun populateInitialDatabase(dao: InventoryDao) {
                if (dao.getItemCount() == 0) {
                    dao.insertAll(DatabaseSeedData.initialInventoryItems)
                }
            }
        }
    }
}
