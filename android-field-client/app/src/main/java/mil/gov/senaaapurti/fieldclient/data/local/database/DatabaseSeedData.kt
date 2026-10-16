package mil.gov.senaaapurti.fieldclient.data.local.database

import mil.gov.senaaapurti.fieldclient.data.local.entity.ConvoyEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.IndentEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.InventoryItemEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.RouteCorridorEntity

object DatabaseSeedData {
    val initialInventoryItems = listOf(
        // --- CLASS V: MUNITIONS & ARMAMENT ---
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
            sku = "MUN-84MM-CG",
            barcode = "8901234500117",
            itemName = "84mm Carl Gustaf HE Anti-Tank Rocket",
            category = "MUNITIONS",
            unitOfMeasure = "ROUNDS",
            currentStock = 180,
            criticalThreshold = 150,
            binLocation = "BAY-OR-A09",
            dailyBurnRate = 18f
        ),
        InventoryItemEntity(
            sku = "MUN-120MM-MOR",
            barcode = "8901234500124",
            itemName = "120mm Heavy Mortar High-Angle Bomb",
            category = "MUNITIONS",
            unitOfMeasure = "ROUNDS",
            currentStock = 240,
            criticalThreshold = 200,
            binLocation = "BAY-OR-A12",
            dailyBurnRate = 22f
        ),

        // --- CLASS I: SUBSISTENCE & RATIONS ---
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
            sku = "RAT-ENE-BIS",
            barcode = "8901234500131",
            itemName = "High-Calorie Nutritive Energy Biscuits",
            category = "RATIONS",
            unitOfMeasure = "CARTONS",
            currentStock = 620,
            criticalThreshold = 400,
            binLocation = "DEPOT-RAT-B18",
            dailyBurnRate = 45f
        ),
        InventoryItemEntity(
            sku = "RAT-DRY-MEAL",
            barcode = "8901234500148",
            itemName = "Freeze-Dried Dal & Rice Glacier Self-Heating Kit",
            category = "RATIONS",
            unitOfMeasure = "KITS",
            currentStock = 780,
            criticalThreshold = 600,
            binLocation = "DEPOT-RAT-B22",
            dailyBurnRate = 90f
        ),

        // --- CLASS III: POL (PETROLEUM, OILS & LUBRICANTS) ---
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
            sku = "FUEL-HSD-WINT",
            barcode = "8901234500155",
            itemName = "Winter Grade High-Speed Diesel (-40°C Anti-Gel)",
            category = "POL",
            unitOfMeasure = "LITERS",
            currentStock = 8400,
            criticalThreshold = 7500,
            binLocation = "POL-TANK-CENTRAL",
            dailyBurnRate = 820f
        ),
        InventoryItemEntity(
            sku = "POL-LUB-COLD",
            barcode = "8901234500162",
            itemName = "Sub-Zero Engine & Gearbox Synthetic Oil 0W-30",
            category = "POL",
            unitOfMeasure = "DRUMS",
            currentStock = 85,
            criticalThreshold = 60,
            binLocation = "POL-DRUM-BAY",
            dailyBurnRate = 6f
        ),

        // --- CLASS VIII: MEDICAL & HIGH-ALTITUDE LIFE SUPPORT ---
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
            sku = "MED-O2-10L",
            barcode = "8901234500179",
            itemName = "High-Altitude Portable Oxygen Cylinder (10L)",
            category = "MEDICAL",
            unitOfMeasure = "CYLINDERS",
            currentStock = 140,
            criticalThreshold = 100,
            binLocation = "MED-O2-STORE",
            dailyBurnRate = 16f
        ),
        InventoryItemEntity(
            sku = "MED-GAMOW-BAG",
            barcode = "8901234500186",
            itemName = "Portable Hyperbaric Chamber (Gamow Bag - HAPE/HACE)",
            category = "MEDICAL",
            unitOfMeasure = "UNITS",
            currentStock = 18,
            criticalThreshold = 12,
            binLocation = "MED-HIGH-ALT",
            dailyBurnRate = 1f
        ),

        // --- CLASS IX: VEHICLE & ARMOR SPARES ---
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
            sku = "SPR-T90-BOGIE",
            barcode = "8901234500193",
            itemName = "T-90 Bhishma Roadwheel Bogie Bearings & Seals",
            category = "SPARES",
            unitOfMeasure = "SETS",
            currentStock = 32,
            criticalThreshold = 25,
            binLocation = "EME-BAY-C08",
            dailyBurnRate = 2f
        ),
        InventoryItemEntity(
            sku = "SPR-STAL-CHAIN",
            barcode = "8901234500209",
            itemName = "Stallion 4x4 / Tatra 8x8 Heavy Snow Grip Chains",
            category = "SPARES",
            unitOfMeasure = "PAIRS",
            currentStock = 110,
            criticalThreshold = 80,
            binLocation = "EME-BAY-C14",
            dailyBurnRate = 8f
        ),

        // --- CLASS II: ECC CLOTHING & GLACIER GEAR ---
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
        ),
        InventoryItemEntity(
            sku = "ECC-BOOT-ARC",
            barcode = "8901234500216",
            itemName = "Sub-Zero Arctic Combat Boots with Crampon Cleats",
            category = "EQUIPMENT",
            unitOfMeasure = "PAIRS",
            currentStock = 280,
            criticalThreshold = 200,
            binLocation = "DEPOT-ECC-D05",
            dailyBurnRate = 12f
        )
    )

    val initialConvoys = listOf(
        ConvoyEntity(
            convoyId = "CNV-CHETAK-02",
            callSign = "CHETAK-2",
            vehicleCount = 18,
            tonnage = 144f,
            supplyClass = "Class III (Sub-Zero POL & Arctic Aviation Fuel)",
            origin = "Pathankot Base Depot",
            destination = "14 Corps Depot (Leh)",
            routeName = "Manali-Leh Strategic Highway (via Atal Tunnel & Baralacha La)",
            status = "EN_ROUTE",
            eta = "14 Hours (Tomorrow 08:30)",
            commander = "Subedar Gurdeep Singh, ASC",
            hazardWarning = "Baralacha La pass temperature -18°C. Surface icy but open.",
            lastCheckpoint = "Keylong Staging Post"
        ),
        ConvoyEntity(
            convoyId = "CNV-TRISHUL-08",
            callSign = "TRISHUL-8",
            vehicleCount = 12,
            tonnage = 96f,
            supplyClass = "Class V (155mm HE Artillery Shells)",
            origin = "Central Ordnance Depot (Chandimandir)",
            destination = "Forward Ammunition Point (Kargil)",
            routeName = "Srinagar-Leh NH-1D Highway (via Zojila)",
            status = "DIVERTED",
            eta = "26 Hours (Post-Clearance)",
            commander = "Major Vikramaditya, AOC",
            hazardWarning = "Zojila pass heavy blizzard & avalanche risk. Diverting via Nimmu-Padam axis.",
            lastCheckpoint = "Sonamarg Military Gate"
        ),
        ConvoyEntity(
            convoyId = "CNV-GARUDA-04",
            callSign = "GARUDA-4",
            vehicleCount = 8,
            tonnage = 42f,
            supplyClass = "Class VIII (High-Altitude O2 & IFAK Trauma Kits)",
            origin = "14 Corps Base Depot (Leh)",
            destination = "Siachen Base Camp (Partapur)",
            routeName = "Khardung La Pass Corridor (17,582 ft)",
            status = "EN_ROUTE",
            eta = "5 Hours (Today 22:45)",
            commander = "Capt. Rohan Sen, AMC",
            hazardWarning = "Sub-zero black ice on northern descent into Nubra Valley.",
            lastCheckpoint = "South Pullu Military Checkpost"
        ),
        ConvoyEntity(
            convoyId = "CNV-HIMALAYAN-01",
            callSign = "HIMALAYAN-EXPRESS",
            vehicleCount = 24,
            tonnage = 210f,
            supplyClass = "Class I (High-Altitude Rations & MREs)",
            origin = "Ambala Supply Depot",
            destination = "Surya / Central Depots",
            routeName = "Grand Trunk Plains Corridor",
            status = "STAGED",
            eta = "32 Hours (Departs 05:00)",
            commander = "Subedar Major K. S. Rathore",
            hazardWarning = "Clear weather. Routine operational echelon dispatch.",
            lastCheckpoint = "Ambala Cantonment Gate"
        )
    )

    val initialIndents = listOf(
        IndentEntity(
            indentId = "IND-2026-10-881",
            sku = "FUEL-JP8-ARC",
            itemName = "JP-8 Arctic Grade Aviation/Convoy Fuel",
            category = "POL",
            quantityRequested = 2400,
            unitOfMeasure = "LITERS",
            priority = "URGENT",
            justification = "Forward helipad refuelling point & snow clearing machinery operations",
            status = "APPROVED",
            authorizingOfficer = "Lt. Col. R. Rathore, QM",
            hash = "9039aed288926a924a3db52466ea39834e82b20b9ba42695081894857c64f4da"
        ),
        IndentEntity(
            indentId = "IND-2026-10-879",
            sku = "MUN-155MM-HE",
            itemName = "155mm High-Explosive Artillery Shell",
            category = "MUNITIONS",
            quantityRequested = 120,
            unitOfMeasure = "ROUNDS",
            priority = "EMERGENCY",
            justification = "High-altitude battery live training & forward tactical ammunition posture",
            status = "SUBMITTED",
            authorizingOfficer = "Major Amit Sharma (QM)",
            hash = "4a18df7b89e2c650785ea82c0fa028d73b028741e9768a356db01b17d0577609"
        ),
        IndentEntity(
            indentId = "IND-2026-10-865",
            sku = "MED-O2-10L",
            itemName = "High-Altitude Portable Oxygen Cylinder (10L)",
            category = "MEDICAL",
            quantityRequested = 40,
            unitOfMeasure = "CYLINDERS",
            priority = "URGENT",
            justification = "Acclimatization staging camp replenishment at 14,200 ft",
            status = "DISPATCHED",
            authorizingOfficer = "Col. S. Deshmukh, CO",
            hash = "7721be8384f5012e873190df035789124a90184b2374092b724508934fa09823"
        ),
        IndentEntity(
            indentId = "IND-2026-10-840",
            sku = "ECC-SUIT-GLACIER",
            itemName = "Extreme Cold Climate Multi-Layer Glacier Suit",
            category = "EQUIPMENT",
            quantityRequested = 80,
            unitOfMeasure = "SUITS",
            priority = "ROUTINE",
            justification = "Winter rotation change for forward picket rifle companies",
            status = "DELIVERED",
            authorizingOfficer = "Lt. Col. R. Rathore, QM",
            hash = "21a30894fe8390b1273e894b89320b98234ea781203b87941203948b89410293"
        )
    )

    val initialRouteCorridors = listOf(
        RouteCorridorEntity(
            corridorId = "COR-SRINAGAR-LEH",
            name = "Srinagar-Leh NH-1D Highway",
            passName = "Zojila Pass",
            altitudeFt = 11575,
            status = "AVALANCHE_CLOSED",
            temperatureC = -14,
            activeWarning = "Blizzard avalanche near Captain Mode. Heavy snow clearance active.",
            alternateRoute = "Nimmu-Padam-Darcha Strategic Axis",
            clearanceUnit = "BRO Project Beacon"
        ),
        RouteCorridorEntity(
            corridorId = "COR-MANALI-LEH",
            name = "Manali-Leh Strategic Highway",
            passName = "Baralacha La Pass",
            altitudeFt = 16040,
            status = "CHAINS_REQUIRED",
            temperatureC = -18,
            activeWarning = "Sub-zero ice conditions. Tire chains mandatory for all military columns.",
            alternateRoute = "Atal Tunnel - Darcha Bypass",
            clearanceUnit = "BRO Project Himank"
        ),
        RouteCorridorEntity(
            corridorId = "COR-NIMMU-PADAM",
            name = "Nimmu-Padam-Darcha Highway",
            passName = "Shinku La Tunnel Axis",
            altitudeFt = 14800,
            status = "OPEN",
            temperatureC = -10,
            activeWarning = "All clear. Designated all-weather strategic contingency bypass corridor.",
            alternateRoute = "Primary Strategic Contingency Axis",
            clearanceUnit = "BRO Project Yojak"
        ),
        RouteCorridorEntity(
            corridorId = "COR-KHARDUNG-LA",
            name = "Leh-Nubra-Siachen Highway",
            passName = "Khardung La Pass",
            altitudeFt = 17582,
            status = "OPEN",
            temperatureC = -22,
            activeWarning = "Extreme sub-zero gale winds (75 km/h). Essential convoys only.",
            alternateRoute = "Wari La Bypass",
            clearanceUnit = "14 Corps Engineering Regt"
        )
    )
}
