package mil.gov.senaaapurti.fieldclient.data.local.database

import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity

object DatabaseSeedData {
    val initialInventoryItems = listOf(
        InventoryItemEntity(
            sku = "MUN-155MM-HE",
            barcode = "8901234500018",
            itemName = "155mm High-Explosive Artillery Shell",
            category = "MUNITIONS",
            unitOfMeasure = "ROUNDS",
            currentStock = 320,
            criticalThreshold = 500,
            binLocation = "BAY-OR-A01",
            dailyBurnRate = 65f
        ),
        InventoryItemEntity(
            sku = "MUN-762-NATO",
            barcode = "8901234500025",
            itemName = "7.62x51mm NATO Ball Ammunition",
            category = "MUNITIONS",
            unitOfMeasure = "CRATES",
            currentStock = 410,
            criticalThreshold = 300,
            binLocation = "BAY-OR-A04",
            dailyBurnRate = 35f
        ),
        InventoryItemEntity(
            sku = "RAT-MRE-HALT",
            barcode = "8901234500032",
            itemName = "High-Altitude Combat Ration Pack (3500 kcal)",
            category = "RATIONS",
            unitOfMeasure = "PACKS",
            currentStock = 950,
            criticalThreshold = 1200,
            binLocation = "DEPOT-RAT-B12",
            dailyBurnRate = 180f
        ),
        InventoryItemEntity(
            sku = "FUEL-JP8-ARC",
            barcode = "8901234500049",
            itemName = "JP-8 Arctic Grade Aviation/Convoy Fuel",
            category = "POL",
            unitOfMeasure = "LITERS",
            currentStock = 3800,
            criticalThreshold = 5000,
            binLocation = "POL-TANK-NORTH",
            dailyBurnRate = 520f
        ),
        InventoryItemEntity(
            sku = "MED-IFAK-TRAUMA",
            barcode = "8901234500056",
            itemName = "Combat Trauma & Hypothermia Kit",
            category = "MEDICAL",
            unitOfMeasure = "KITS",
            currentStock = 95,
            criticalThreshold = 150,
            binLocation = "MED-CAB-01",
            dailyBurnRate = 12f
        ),
        InventoryItemEntity(
            sku = "SPR-BMP2-TRK",
            barcode = "8901234500063",
            itemName = "BMP-II Track Pins & Cold-Start Bushings",
            category = "SPARES",
            unitOfMeasure = "SETS",
            currentStock = 48,
            criticalThreshold = 60,
            binLocation = "EME-BAY-C03",
            dailyBurnRate = 4f
        ),
        InventoryItemEntity(
            sku = "ECC-SUIT-GLACIER",
            barcode = "8901234500070",
            itemName = "Extreme Cold Climate Multi-Layer Glacier Suit",
            category = "EQUIPMENT",
            unitOfMeasure = "SUITS",
            currentStock = 320,
            criticalThreshold = 250,
            binLocation = "DEPOT-ECC-D01",
            dailyBurnRate = 15f
        )
    )
}
