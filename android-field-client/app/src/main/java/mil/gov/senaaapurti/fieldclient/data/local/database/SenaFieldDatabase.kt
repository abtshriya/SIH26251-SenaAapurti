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
import mil.gov.senaaapurti.fieldclient.data.local.dao.OperationsDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.ScanTransactionDao
import mil.gov.senaaapurti.fieldclient.data.local.dao.SyncOutboxDao
import mil.gov.senaaapurti.fieldclient.data.local.entity.ConvoyEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.IndentEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.RouteCorridorEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.ScanTransactionEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity

@Database(
    entities = [
        InventoryItemEntity::class,
        ScanTransactionEntity::class,
        SyncOutboxQueueEntity::class,
        ConvoyEntity::class,
        IndentEntity::class,
        RouteCorridorEntity::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class SenaFieldDatabase : RoomDatabase() {

    abstract fun inventoryDao(): InventoryDao
    abstract fun scanTransactionDao(): ScanTransactionDao
    abstract fun syncOutboxDao(): SyncOutboxDao
    abstract fun operationsDao(): OperationsDao

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
                        populateInitialDatabase(database)
                    }
                }
            }

            override fun onOpen(db: SupportSQLiteDatabase) {
                super.onOpen(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialDatabase(database)
                    }
                }
            }

            suspend fun populateInitialDatabase(database: SenaFieldDatabase) {
                val inventoryDao = database.inventoryDao()
                if (inventoryDao.getItemCount() < DatabaseSeedData.initialInventoryItems.size) {
                    inventoryDao.insertAll(DatabaseSeedData.initialInventoryItems)
                }

                val operationsDao = database.operationsDao()
                if (operationsDao.getIndentCount() == 0) {
                    operationsDao.insertConvoys(DatabaseSeedData.initialConvoys)
                    operationsDao.insertIndents(DatabaseSeedData.initialIndents)
                    operationsDao.insertCorridors(DatabaseSeedData.initialRouteCorridors)
                }
            }
        }
    }
}
