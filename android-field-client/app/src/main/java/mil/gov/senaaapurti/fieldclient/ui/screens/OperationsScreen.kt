package mil.gov.senaaapurti.fieldclient.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AltRoute
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import mil.gov.senaaapurti.fieldclient.data.local.entity.ConvoyEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.IndentEntity
import mil.gov.senaaapurti.fieldclient.data.local.entity.RouteCorridorEntity
import mil.gov.senaaapurti.fieldclient.repository.InventoryRepository
import mil.gov.senaaapurti.fieldclient.repository.OperationsRepository
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveDark
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveLight
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOlivePrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.MilitaryGold
import mil.gov.senaaapurti.fieldclient.ui.theme.SafetyAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusMismatchAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusVerifiedGreen
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalCardBorder
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalSurfaceDark
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextMuted
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextPrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextSecondary

@Composable
fun OperationsScreen(
    operationsRepository: OperationsRepository,
    inventoryRepository: InventoryRepository
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabTitles = listOf("Convoys & Routes", "Indents / Requisitions", "Wargame & Forecast")

    val convoys by operationsRepository.allConvoys.collectAsState(initial = emptyList())
    val corridors by operationsRepository.allCorridors.collectAsState(initial = emptyList())
    val indents by operationsRepository.allIndents.collectAsState(initial = emptyList())
    val inventoryItems by inventoryRepository.allInventoryItems.collectAsState(initial = emptyList())

    val coroutineScope = rememberCoroutineScope()
    var showCreateIndentDialog by remember { mutableStateOf(false) }
    var selectedConvoyForReroute by remember { mutableStateOf<ConvoyEntity?>(null) }
    var actionNotification by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F1511))
    ) {
        // --- 1. OPERATION SUB-TABS ---
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = TacticalSurfaceDark,
            contentColor = MilitaryGold,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                    color = MilitaryGold,
                    height = 3.dp
                )
            }
        ) {
            tabTitles.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            text = title,
                            fontSize = 12.sp,
                            fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTab == index) MilitaryGold else TacticalTextMuted
                        )
                    }
                )
            }
        }

        // Action Notification Banner
        AnimatedVisibility(visible = actionNotification.isNotBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0x252E8540))
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    text = actionNotification,
                    color = StatusVerifiedGreen,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        // --- 2. TAB CONTENT ---
        when (selectedTab) {
            0 -> ConvoysAndRoutesTab(
                convoys = convoys,
                corridors = corridors,
                onRerouteClick = { selectedConvoyForReroute = it }
            )
            1 -> IndentsTab(
                indents = indents,
                onCreateIndentClick = { showCreateIndentDialog = true }
            )
            2 -> WargameForecastTab(
                onAuthorizeWinterBuffer = { category ->
                    coroutineScope.launch {
                        val authCode = operationsRepository.authorizeWinterBuffer(category, "14 CORPS LEH")
                        actionNotification = "Pre-Winter Buffer Authorized ($authCode). Outbox queued."
                    }
                },
                onSimulateAvalancheMitigation = {
                    coroutineScope.launch {
                        operationsRepository.rerouteConvoy(
                            convoyId = "CNV-TRISHUL-08",
                            newRoute = "Nimmu-Padam-Darcha Strategic Axis (Zanskar Alternate)",
                            reason = "Simulated Zojila Pass blizzard avalanche block. Contingency protocol active."
                        )
                        actionNotification = "Mitigation executed: TRISHUL-8 rerouted via Nimmu-Padam axis."
                    }
                }
            )
        }
    }

    // --- DIALOG: CREATE INDENT ---
    if (showCreateIndentDialog) {
        CreateIndentDialog(
            inventoryItems = inventoryItems,
            onDismiss = { showCreateIndentDialog = false },
            onSubmit = { sku, name, cat, qty, uom, priority, justification ->
                coroutineScope.launch {
                    val indent = operationsRepository.createIndent(
                        sku = sku,
                        itemName = name,
                        category = cat,
                        quantity = qty,
                        unitOfMeasure = uom,
                        priority = priority,
                        justification = justification
                    )
                    actionNotification = "Indent ${indent.indentId} filed with SHA-256 seal. Added to Outbox."
                    showCreateIndentDialog = false
                }
            }
        )
    }

    // --- DIALOG: REROUTE CONVOY ---
    selectedConvoyForReroute?.let { cnv ->
        AlertDialog(
            onDismissRequest = { selectedConvoyForReroute = null },
            containerColor = TacticalSurfaceDark,
            title = {
                Text(
                    text = "Emergency Reroute • ${cnv.callSign}",
                    color = TacticalTextPrimary,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column {
                    Text(
                        text = "Current Axis: ${cnv.routeName}",
                        color = TacticalTextSecondary,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Select Designated Contingency Bypass Corridor:",
                        color = MilitaryGold,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(ArmyOliveDark)
                            .padding(10.dp)
                    ) {
                        Text(
                            text = "Nimmu-Padam-Darcha All-Weather Strategic Highway (via Shinku La)",
                            color = TacticalTextPrimary,
                            fontSize = 12.sp
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            operationsRepository.rerouteConvoy(
                                convoyId = cnv.convoyId,
                                newRoute = "Nimmu-Padam-Darcha All-Weather Strategic Axis",
                                reason = "Commander tactical diversion around high-altitude pass alert."
                            )
                            actionNotification = "${cnv.callSign} successfully diverted to Nimmu-Padam corridor."
                            selectedConvoyForReroute = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary)
                ) {
                    Text("Confirm Diversion", color = Color.White)
                }
            },
            dismissButton = {
                Button(
                    onClick = { selectedConvoyForReroute = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                ) {
                    Text("Cancel", color = TacticalTextMuted)
                }
            }
        )
    }
}

// ============================================================================
// 1. CONVOYS & ROUTES TAB
// ============================================================================
@Composable
private fun ConvoysAndRoutesTab(
    convoys: List<ConvoyEntity>,
    corridors: List<RouteCorridorEntity>,
    onRerouteClick: (ConvoyEntity) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "TRACKED STRATEGIC CONVOYS",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MilitaryGold,
                letterSpacing = 1.sp
            )
        }

        items(convoys) { cnv ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(TacticalCardBorder)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(SafetyAmber.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.LocalShipping, contentDescription = null, tint = SafetyAmber, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = cnv.callSign,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TacticalTextPrimary
                                )
                                Text(
                                    text = "${cnv.vehicleCount} Vehicles • ${cnv.tonnage}T • ${cnv.origin} → ${cnv.destination}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TacticalTextMuted
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (cnv.status == "DIVERTED") Color(0x35E53E3E) else Color(0x352E8540))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = cnv.status,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (cnv.status == "DIVERTED") Color(0xFFFF6B6B) else StatusVerifiedGreen
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Cargo: ${cnv.supplyClass}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalTextSecondary
                    )
                    Text(
                        text = "Current Axis: ${cnv.routeName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalTextMuted
                    )
                    Text(
                        text = "Commander: ${cnv.commander} • ETA: ${cnv.eta}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MilitaryGold,
                        fontFamily = FontFamily.Monospace
                    )

                    if (cnv.hazardWarning.isNotBlank()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0x20DD6B20))
                                .padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = SafetyAmber, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = cnv.hazardWarning,
                                style = MaterialTheme.typography.labelSmall,
                                color = SafetyAmber
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { onRerouteClick(cnv) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ArmyOliveDark),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.AltRoute, contentDescription = null, tint = MilitaryGold, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Initiate Tactical Reroute", fontSize = 12.sp, color = TacticalTextPrimary)
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "MOUNTAIN PASSES & WEATHER CORRIDORS",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MilitaryGold,
                letterSpacing = 1.sp
            )
        }

        items(corridors) { cor ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(TacticalCardBorder)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "${cor.name} (${cor.passName})",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = TacticalTextPrimary
                        )
                        Text(
                            text = "Altitude: ${cor.altitudeFt} ft • Temp: ${cor.temperatureC}°C",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalTextMuted
                        )
                        Text(
                            text = cor.activeWarning,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (cor.status == "AVALANCHE_CLOSED") Color(0xFFFF6B6B) else SafetyAmber
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                when (cor.status) {
                                    "OPEN" -> Color(0x352E8540)
                                    "AVALANCHE_CLOSED" -> Color(0x35E53E3E)
                                    else -> Color(0x35DD6B20)
                                }
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = cor.status.replace("_", " "),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (cor.status) {
                                "OPEN" -> StatusVerifiedGreen
                                "AVALANCHE_CLOSED" -> Color(0xFFFF6B6B)
                                else -> SafetyAmber
                            }
                        )
                    }
                }
            }
        }
    }
}

// ============================================================================
// 2. INDENTS & REQUISITIONS TAB
// ============================================================================
@Composable
private fun IndentsTab(
    indents: List<IndentEntity>,
    onCreateIndentClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "REGIMENTAL INDENTS & VOUCHERS",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MilitaryGold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "${indents.size} Official Indents Active",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalTextMuted
                )
            }

            Button(
                onClick = onCreateIndentClick,
                colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Raise Indent", fontSize = 12.sp, color = Color.White)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(indents) { ind ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(TacticalCardBorder)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = ind.indentId,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MilitaryGold,
                                fontFamily = FontFamily.Monospace
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(
                                        when (ind.priority) {
                                            "EMERGENCY" -> Color(0x35E53E3E)
                                            "URGENT" -> Color(0x35DD6B20)
                                            else -> Color(0x352E8540)
                                        }
                                    )
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = ind.priority,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = when (ind.priority) {
                                        "EMERGENCY" -> Color(0xFFFF6B6B)
                                        "URGENT" -> SafetyAmber
                                        else -> StatusVerifiedGreen
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "${ind.quantityRequested} ${ind.unitOfMeasure} • ${ind.itemName}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = TacticalTextPrimary
                        )

                        Text(
                            text = "Justification: ${ind.justification}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalTextMuted
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Auth: ${ind.authorizingOfficer}",
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalTextSecondary
                            )

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(ArmyOliveDark)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "STATUS: ${ind.status}",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MilitaryGold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// 3. WARGAME & FORECASTING TAB
// ============================================================================
@Composable
private fun WargameForecastTab(
    onAuthorizeWinterBuffer: (String) -> Unit,
    onSimulateAvalancheMitigation: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section 1: AI Predictive Winter Surge
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(MilitaryGold.copy(alpha = 0.4f))),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(MilitaryGold.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.TrendingUp, contentDescription = null, tint = MilitaryGold, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "AI Seasonal Consumption Predictor",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TacticalTextPrimary
                            )
                            Text(
                                text = "Sub-Zero Winter Multiplier Engine • 14 Corps Sector",
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalTextMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    ForecastSurgeRow("Class III: Sub-Zero POL & Arctic Fuel", "+85% Surge", "Heating & Vehicle Anti-Gel")
                    ForecastSurgeRow("Class VIII: High-Altitude O2 & IFAK", "+120% Surge", "HAPE/HACE Glacier Acclimatization")
                    ForecastSurgeRow("Class I: Combat High-Calorie Rations", "+45% Surge", "3500 kcal Subsistence Standard")
                    ForecastSurgeRow("Class II: Extreme Cold Gear (ECC)", "+65% Surge", "Glacier Rotation Outfitting")

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { onAuthorizeWinterBuffer("Class III POL & Arctic Fuel") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MilitaryGold),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.ElectricBolt, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Authorize Pre-Winter Buffer Dispatch", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Section 2: Wargaming Threat Simulator
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(SafetyAmber.copy(alpha = 0.4f))),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(SafetyAmber.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = SafetyAmber, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "C4ISR Threat Simulation & Wargaming",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TacticalTextPrimary
                            )
                            Text(
                                text = "Contingency Stress-Testing & Route Blockage",
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalTextMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0x20DD6B20))
                            .padding(12.dp)
                    ) {
                        Column {
                            Text(
                                text = "SCENARIO: Zojila Pass Winter Avalanche Closure",
                                fontWeight = FontWeight.Bold,
                                color = SafetyAmber,
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Catastrophic blizzard closes NH-1D transit. 12x 155mm Munitions Convoys stranded at Sonamarg gate without alternate route authorization.",
                                color = TacticalTextSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = onSimulateAvalancheMitigation,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Simulate C4ISR Mitigation Protocol", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ForecastSurgeRow(category: String, surge: String, reason: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = category, fontSize = 12.sp, color = TacticalTextPrimary, fontWeight = FontWeight.SemiBold)
            Text(text = reason, fontSize = 10.sp, color = TacticalTextMuted)
        }
        Text(text = surge, fontSize = 12.sp, color = MilitaryGold, fontWeight = FontWeight.Bold)
    }
}

// ============================================================================
// 4. CREATE INDENT DIALOG
// ============================================================================
@Composable
private fun CreateIndentDialog(
    inventoryItems: List<mil.gov.senaaapurti.fieldclient.data.model.InventoryItem>,
    onDismiss: () -> Unit,
    onSubmit: (sku: String, name: String, cat: String, qty: Int, uom: String, priority: String, justification: String) -> Unit
) {
    var selectedItemIndex by remember { mutableIntStateOf(0) }
    var quantityText by remember { mutableStateOf("100") }
    var priority by remember { mutableStateOf("URGENT") }
    var justification by remember { mutableStateOf("Sub-zero forward post replenishment buffer") }

    val activeItem = inventoryItems.getOrNull(selectedItemIndex) ?: inventoryItems.firstOrNull()

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = TacticalSurfaceDark,
        title = {
            Text(
                text = "Raise Regimental Material Indent",
                color = TacticalTextPrimary,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Select Item to Indent:",
                    color = MilitaryGold,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )

                // Item Selector Box
                activeItem?.let { item ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(ArmyOliveDark)
                            .padding(10.dp)
                    ) {
                        Column {
                            Text(text = item.itemName, fontWeight = FontWeight.Bold, color = TacticalTextPrimary, fontSize = 12.sp)
                            Text(text = "SKU: ${item.sku} • Stock: ${item.currentStock} ${item.unitOfMeasure}", color = TacticalTextMuted, fontSize = 10.sp)
                        }
                    }
                }

                // Quantity Input
                OutlinedTextField(
                    value = quantityText,
                    onValueChange = { quantityText = it },
                    label = { Text("Requisition Quantity") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MilitaryGold,
                        unfocusedBorderColor = TacticalCardBorder,
                        focusedTextColor = TacticalTextPrimary,
                        unfocusedTextColor = TacticalTextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Priority Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("EMERGENCY", "URGENT", "ROUTINE").forEach { prio ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (priority == prio) MilitaryGold else ArmyOliveDark)
                                .clickable { priority = prio }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = prio,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (priority == prio) Color.Black else TacticalTextSecondary
                            )
                        }
                    }
                }

                // Justification Input
                OutlinedTextField(
                    value = justification,
                    onValueChange = { justification = it },
                    label = { Text("Operational Justification") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MilitaryGold,
                        unfocusedBorderColor = TacticalCardBorder,
                        focusedTextColor = TacticalTextPrimary,
                        unfocusedTextColor = TacticalTextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    activeItem?.let {
                        val qty = quantityText.toIntOrNull() ?: 100
                        onSubmit(it.sku, it.itemName, it.category, qty, it.unitOfMeasure, priority, justification)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary)
            ) {
                Text("Submit with Cryptographic Seal", color = Color.White)
            }
        },
        dismissButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
            ) {
                Text("Cancel", color = TacticalTextMuted)
            }
        }
    )
}
