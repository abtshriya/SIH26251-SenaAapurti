package mil.gov.senaaapurti.fieldclient.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AltRoute
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Inventory
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Nightlight
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mil.gov.senaaapurti.fieldclient.data.model.ScanType
import mil.gov.senaaapurti.fieldclient.hardware.RuggedScannerHardwareManager
import mil.gov.senaaapurti.fieldclient.repository.InventoryRepository
import mil.gov.senaaapurti.fieldclient.repository.OperationsRepository
import mil.gov.senaaapurti.fieldclient.repository.ScanRepository
import mil.gov.senaaapurti.fieldclient.repository.SyncRepository
import mil.gov.senaaapurti.fieldclient.ui.screens.HomeScreen
import mil.gov.senaaapurti.fieldclient.ui.screens.InventoryListScreen
import mil.gov.senaaapurti.fieldclient.ui.screens.OperationsScreen
import mil.gov.senaaapurti.fieldclient.ui.screens.ScannerScreen
import mil.gov.senaaapurti.fieldclient.ui.screens.SyncOutboxScreen
import mil.gov.senaaapurti.fieldclient.ui.screens.TacticalMapScreen
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveDark
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOlivePrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.MilitaryGold
import mil.gov.senaaapurti.fieldclient.ui.theme.NightVisionRed
import mil.gov.senaaapurti.fieldclient.ui.theme.SafetyAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusVerifiedGreen
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalCardBorder
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalSurfaceDark
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextMuted
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextPrimary
import mil.gov.senaaapurti.fieldclient.worker.SyncManager

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    data object Home : Screen("home", "Command", Icons.Default.Dashboard)
    data object Map : Screen("map", "Map", Icons.Default.Map)
    data object Scanner : Screen("scanner", "Scan", Icons.Default.QrCodeScanner)
    data object Inventory : Screen("inventory", "Store", Icons.Default.Inventory)
    data object Operations : Screen("operations", "Ops", Icons.Default.AltRoute)
    data object Sync : Screen("sync", "Outbox", Icons.Default.Sync)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(
    inventoryRepository: InventoryRepository,
    scanRepository: ScanRepository,
    syncRepository: SyncRepository,
    operationsRepository: OperationsRepository,
    syncManager: SyncManager,
    hardwareManager: RuggedScannerHardwareManager,
    isNightVisionMode: Boolean,
    onToggleNightVision: () -> Unit
) {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Home) }
    var activeScanType by remember { mutableStateOf(ScanType.INWARD_RECEIPT) }

    val pendingCount by syncRepository.pendingCount.collectAsState(initial = 0)
    val isOnline by syncManager.isOnline.collectAsState()

    val topBarContainerColor = if (isNightVisionMode) Color(0xFF150404) else ArmyOliveDark

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "SENAAAPURTI • ${currentScreen.title.uppercase()}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TacticalTextPrimary,
                        letterSpacing = 0.5.sp
                    )
                },
                actions = {
                    // Outbox Sync Shortcut with Pending Badge
                    IconButton(
                        onClick = { currentScreen = Screen.Sync },
                        modifier = Modifier.size(44.dp)
                    ) {
                        BadgedBox(
                            badge = {
                                if (pendingCount > 0) {
                                    Badge(containerColor = SafetyAmber, contentColor = Color.Black) {
                                        Text("$pendingCount", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Sync,
                                contentDescription = "Outbox Queue",
                                tint = if (currentScreen == Screen.Sync) MilitaryGold else TacticalTextPrimary
                            )
                        }
                    }

                    // Night Vision Toggle
                    IconButton(
                        onClick = onToggleNightVision,
                        modifier = Modifier.size(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Nightlight,
                            contentDescription = "Night Vision Toggle",
                            tint = if (isNightVisionMode) NightVisionRed else MilitaryGold
                        )
                    }

                    // Online / Offline Status Dot
                    Box(
                        modifier = Modifier
                            .padding(end = 12.dp, start = 4.dp)
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (isOnline) StatusVerifiedGreen else SafetyAmber)
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = topBarContainerColor
                ),
                modifier = Modifier.border(1.dp, TacticalCardBorder)
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = if (isNightVisionMode) Color(0xFF100303) else TacticalSurfaceDark,
                modifier = Modifier
                    .height(64.dp)
                    .border(1.dp, TacticalCardBorder)
            ) {
                val screens = listOf(Screen.Home, Screen.Map, Screen.Scanner, Screen.Inventory, Screen.Operations)
                screens.forEach { screen ->
                    val isSelected = currentScreen == screen

                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentScreen = screen },
                        icon = {
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        label = {
                            Text(
                                text = screen.title,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MilitaryGold,
                            selectedTextColor = MilitaryGold,
                            indicatorColor = ArmyOlivePrimary,
                            unselectedIconColor = TacticalTextMuted,
                            unselectedTextColor = TacticalTextMuted
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                Screen.Home -> HomeScreen(
                    inventoryRepository = inventoryRepository,
                    scanRepository = scanRepository,
                    syncRepository = syncRepository,
                    syncManager = syncManager,
                    onNavigateToScanner = { scanType ->
                        activeScanType = scanType
                        currentScreen = Screen.Scanner
                    },
                    onNavigateToInventory = { currentScreen = Screen.Inventory },
                    onNavigateToSync = { currentScreen = Screen.Sync },
                    onNavigateToMap = { currentScreen = Screen.Map },
                    onNavigateToOperations = { currentScreen = Screen.Operations }
                )
                Screen.Map -> TacticalMapScreen(
                    operationsRepository = operationsRepository,
                    onNavigateToConvoyDetails = { currentScreen = Screen.Operations }
                )
                Screen.Scanner -> ScannerScreen(
                    initialScanType = activeScanType,
                    scanRepository = scanRepository,
                    hardwareManager = hardwareManager,
                    isNightVisionMode = isNightVisionMode,
                    onToggleNightVision = onToggleNightVision
                )
                Screen.Inventory -> InventoryListScreen(
                    inventoryRepository = inventoryRepository
                )
                Screen.Operations -> OperationsScreen(
                    operationsRepository = operationsRepository,
                    inventoryRepository = inventoryRepository
                )
                Screen.Sync -> SyncOutboxScreen(
                    syncRepository = syncRepository,
                    syncManager = syncManager,
                    inventoryRepository = inventoryRepository
                )
            }
        }
    }
}
