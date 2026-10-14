# SenaAapurti Field Client (Ruggedized Android Field APK)

**Official Mobile Client for Military Handheld Terminals & Tactical Field Tablets**  
**Version:** 3.4.1 (APK • 42 MB)  
**Package:** `mil.gov.senaaapurti.fieldclient`  
**Classification:** RESTRICTED • DGOS C4ISR Decision Support  

---

## 1. Overview & Operational Mandate
The **SenaAapurti Field Client** is a standalone, offline-first native Android application engineered for Regimental Quartermasters, Base Ordnance Depot storemen, and forward logistics operators operating in extreme Himalayan sectors (Siachen, Ladakh, Kargil, Arunachal) where cellular and satellite connectivity is intermittent or non-existent.

### Key Capabilities:
- **Offline-First Cache**: 100% operational without active cellular or internet connectivity using an embedded Room database cache.
- **Outbox Pattern with SHA-256 Hashes**: All crate receipts, outward dispatches, and physical stock reconciliations are cryptographically hashed and held in a local mutation queue.
- **Hardware Scanner Key Interception**: Direct listening on `KeyEvent` for dedicated physical yellow/orange scan buttons on rugged enterprise devices (Zebra TC57/77, Honeywell Dolphin, Urovo DT50, BEL tactical terminals).
- **Tactical Audio & Haptic Feedback**: Dual-tone sound and distinct vibration patterns for instant blind verification in noisy field environments.
- **Combat Touch Compliance**: Minimum 48dp touch targets on all interactive elements for operation with heavy winter combat gloves.
- **Low-Light / Night Vision Mode**: Tactical red mode toggle for light discipline during forward night operations.

---

## 2. Architecture & Modules

```
mil.gov.senaaapurti.fieldclient/
├── data/
│   ├── local/
│   │   ├── entity/ (InventoryItemEntity, ScanTransactionEntity, SyncOutboxQueueEntity)
│   │   ├── dao/ (InventoryDao, ScanTransactionDao, SyncOutboxDao)
│   │   ├── database/ (SenaFieldDatabase, DatabaseSeedData)
│   │   └── converters/ (Converters)
│   └── model/ (InventoryItem, ScanTransaction, ScanVerificationResult)
├── repository/
│   ├── InventoryRepository (Offline search, catalog filters, stock reconciliation)
│   ├── ScanRepository (Barcode resolution, stock delta, SHA-256 Outbox queue)
│   └── SyncRepository (Outbox audit flow, retry metrics)
├── hardware/
│   └── RuggedScannerHardwareManager (Zebra/Honeywell/Urovo key codes, ToneGenerator, Vibrator, Torch)
├── worker/
│   ├── SyncOutboxWorker (AndroidX WorkManager background sync)
│   └── SyncManager (ConnectivityManager monitor & manual force sync trigger)
└── ui/
    ├── theme/ (Color.kt, Theme.kt, Type.kt with Deep Olive Drab #1B3B22 and Night Vision Red)
    ├── navigation/ (AppNavigation.kt)
    └── screens/
        ├── HomeScreen.kt (Command overview, live network banner, quick tiles)
        ├── ScannerScreen.kt (HUD reticle viewfinder, batch counter, instant pills)
        ├── InventoryListScreen.kt (Offline catalog, category filters, steppers)
        └── SyncOutboxScreen.kt (Mutation queue, SHA-256 hash badges, force sync)
```

---

## 3. Hardware Key Trigger Mappings
The hardware manager captures key codes from industrial scanner grips and triggers:
- `KeyEvent.KEYCODE_BUTTON_R1` (Standard Android Trigger)
- `KeyEvent.KEYCODE_SCAN` (Android Scan Key)
- `293` (Zebra TC5x/TC7x Side Trigger)
- `294` (Honeywell Dolphin Hardware Scan)
- `296` (Urovo DT50 Scan Button)
- `KeyEvent.KEYCODE_VOLUME_DOWN` (Fallback trigger on commercial ruggedized smartphones)

---

## 4. Build & Deployment

### Prerequisites:
- Android Studio Ladybug (2024.2+) or Android CLI
- JDK 17+
- Android SDK 34 (minSdk 26, targetSdk 34)

### Building the APK:
```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease
```
The compiled APK will be located at:
`app/build/outputs/apk/release/app-release.apk`
