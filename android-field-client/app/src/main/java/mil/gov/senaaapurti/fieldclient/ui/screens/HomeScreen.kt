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
import androidx.compose.material.icons.filled.AltRoute
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mil.gov.senaaapurti.fieldclient.data.model.ScanTransaction
import mil.gov.senaaapurti.fieldclient.data.model.ScanType
import mil.gov.senaaapurti.fieldclient.data.model.VerificationStatus
import mil.gov.senaaapurti.fieldclient.repository.InventoryRepository
import mil.gov.senaaapurti.fieldclient.repository.ScanRepository
import mil.gov.senaaapurti.fieldclient.repository.SyncRepository
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveDark
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveLight
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOlivePrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.MilitaryGold
import mil.gov.senaaapurti.fieldclient.ui.theme.SafetyAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusMismatchAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusUnregisteredRed
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusVerifiedGreen
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalCardBorder
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalSurfaceDark
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextMuted
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextPrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextSecondary
import mil.gov.senaaapurti.fieldclient.worker.SyncManager

@Composable
fun HomeScreen(
    inventoryRepository: InventoryRepository,
    scanRepository: ScanRepository,
    syncRepository: SyncRepository,
    syncManager: SyncManager,
    onNavigateToScanner: (ScanType) -> Unit,
    onNavigateToInventory: () -> Unit,
    onNavigateToSync: () -> Unit,
    onNavigateToMap: () -> Unit,
    onNavigateToOperations: () -> Unit
) {
    val isOnlineNetwork by syncManager.isOnline.collectAsState()
    var simulatedOfflineMode by remember { mutableStateOf(false) }
    val effectiveOnline = isOnlineNetwork && !simulatedOfflineMode

    val pendingOutboxCount by syncRepository.pendingCount.collectAsState(initial = 0)
    val inventoryItems by inventoryRepository.allInventoryItems.collectAsState(initial = emptyList())
    val recentTransactions by scanRepository.recentTransactions.collectAsState(initial = emptyList())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // --- 1. REGIMENTAL C4ISR AUTHORITY BANNER & ASCON LINK ---
        item {
            RegimentalAuthorityBanner(
                isOnline = effectiveOnline,
                simulatedOffline = simulatedOfflineMode,
                onToggleSimulatedOffline = { simulatedOfflineMode = !simulatedOfflineMode }
            )
        }

        // --- 2. COMBAT READINESS & DOS STOCK POSTURE HUD ---
        item {
            CombatReadinessKpiCard(
                cachedItemCount = inventoryItems.size,
                pendingOutboxCount = pendingOutboxCount,
                onSyncClick = onNavigateToSync
            )
        }

        // --- 3. STRATEGIC DAYS OF SUPPLY (DOS) GAUGES ---
        item {
            Text(
                text = "FORWARD STOCK RESERVES (DAYS OF SUPPLY)",
                style = MaterialTheme.typography.labelSmall,
                color = MilitaryGold,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(start = 4.dp, bottom = 2.dp)
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(TacticalCardBorder)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    DosPostureRow("Class I: Combat Rations (MREs)", "180 DOS", 0.95f, StatusVerifiedGreen)
                    DosPostureRow("Class III: Sub-Zero POL & JP-8", "62 DOS", 0.72f, StatusVerifiedGreen)
                    DosPostureRow("Class V: 155mm Artillery Shells", "42 DOF", 0.84f, StatusVerifiedGreen)
                    DosPostureRow("Class VIII: High-Alt O2 & IFAK", "88 DOS", 0.90f, StatusVerifiedGreen)
                    DosPostureRow("Class IX: T-90/BMP Armor Spares", "34 DOS", 0.55f, SafetyAmber)
                }
            }
        }

        // --- 4. C4ISR OPERATIONAL WARNING FEED ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0x20DD6B20)),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(SafetyAmber.copy(alpha = 0.5f))),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = SafetyAmber, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "ZOJILA PASS CLOSURE ALERT",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = SafetyAmber
                        )
                        Text(
                            text = "Blizzard near Captain Mode. Convoy TRISHUL-8 diverted to Nimmu-Padam axis. BRO Beacon clearance active.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalTextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // --- 5. TACTICAL QUICK ACTION GRID ---
        item {
            Text(
                text = "TACTICAL QUICK ACTIONS",
                style = MaterialTheme.typography.labelSmall,
                color = MilitaryGold,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(start = 4.dp, bottom = 2.dp)
            )

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    TacticalActionTile(
                        title = "Inward Scan",
                        subtitle = "Optical Crate Receipt",
                        icon = Icons.Default.QrCodeScanner,
                        iconTint = StatusVerifiedGreen,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToScanner(ScanType.INWARD_RECEIPT) }
                    )
                    TacticalActionTile(
                        title = "Convoy Verify",
                        subtitle = "Outward Dispatch",
                        icon = Icons.Default.LocalShipping,
                        iconTint = SafetyAmber,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToScanner(ScanType.DISPATCH_VERIFY) }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    TacticalActionTile(
                        title = "Tactical Map",
                        subtitle = "Defense Corridors",
                        icon = Icons.Default.Map,
                        iconTint = Color(0xFF60A5FA),
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToMap
                    )
                    TacticalActionTile(
                        title = "Operations",
                        subtitle = "Convoys & Indents",
                        icon = Icons.Default.AltRoute,
                        iconTint = MilitaryGold,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToOperations
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    TacticalActionTile(
                        title = "Store Ledger",
                        subtitle = "${inventoryItems.size} Items Cached",
                        icon = Icons.Default.FactCheck,
                        iconTint = StatusVerifiedGreen,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToInventory
                    )
                    TacticalActionTile(
                        title = "Sync & Audit",
                        subtitle = "$pendingOutboxCount Queued Hash",
                        icon = Icons.Default.Sync,
                        iconTint = if (pendingOutboxCount > 0) SafetyAmber else TacticalTextMuted,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToSync
                    )
                }
            }
        }

        // --- 6. RECENT LOCAL VERIFIED FIELD TRANSACTIONS ---
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "RECENT FIELD TRANSACTIONS",
                    style = MaterialTheme.typography.labelSmall,
                    color = MilitaryGold,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "${recentTransactions.size} Logged Offline",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextMuted
                )
            }
        }

        if (recentTransactions.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(TacticalCardBorder)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "No recent field transactions. Tap 'Inward Scan' or press physical scanner button to record barcode movements.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TacticalTextMuted,
                        modifier = Modifier.padding(16.dp),
                        fontSize = 12.sp
                    )
                }
            }
        } else {
            items(recentTransactions.take(6)) { tx ->
                TransactionListItem(transaction = tx)
            }
        }
    }
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

@Composable
private fun RegimentalAuthorityBanner(
    isOnline: Boolean,
    simulatedOffline: Boolean,
    onToggleSimulatedOffline: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ArmyOliveDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(MilitaryGold.copy(alpha = 0.4f))),
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "14 RAJPUT (MECHANISED)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TacticalTextPrimary,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = "14 CORPS FIRE & FURY • LEH LADAKH",
                        style = MaterialTheme.typography.labelSmall,
                        color = MilitaryGold,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Interactive Online / Offline Satellite Link Pill
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (isOnline) Color(0x352E8540) else Color(0x35DD6B20))
                        .border(1.dp, if (isOnline) StatusVerifiedGreen else SafetyAmber, RoundedCornerShape(6.dp))
                        .clickable { onToggleSimulatedOffline() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(if (isOnline) StatusVerifiedGreen else SafetyAmber)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isOnline) "ASCON ONLINE" else "OFFLINE MODE",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isOnline) StatusVerifiedGreen else SafetyAmber
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Auth: Lt. Col. R. Rathore, QM (IC-71044)",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextSecondary,
                    fontSize = 11.sp
                )
                Text(
                    text = "Tap pill to toggle offline simulation",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextMuted,
                    fontSize = 9.sp
                )
            }
        }
    }
}

@Composable
private fun CombatReadinessKpiCard(
    cachedItemCount: Int,
    pendingOutboxCount: Int,
    onSyncClick: () -> Unit
) {
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
                    text = "COMBAT READINESS POSTURE",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextMuted,
                    letterSpacing = 0.5.sp
                )
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = "97.2%",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = StatusVerifiedGreen,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "MISSION CAPABLE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = StatusVerifiedGreen,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }

                Text(
                    text = "$cachedItemCount Defense Items • $pendingOutboxCount Outbox Mutations",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalTextSecondary
                )
            }

            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(CircleShape)
                    .background(ArmyOliveDark)
                    .border(2.dp, MilitaryGold, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Shield, contentDescription = null, tint = MilitaryGold, modifier = Modifier.size(26.dp))
            }
        }
    }
}

@Composable
private fun DosPostureRow(name: String, value: String, progress: Float, color: Color) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = name, fontSize = 11.sp, color = TacticalTextPrimary, fontWeight = FontWeight.SemiBold)
            Text(text = value, fontSize = 11.sp, color = color, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
        }
        Spacer(modifier = Modifier.height(3.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(Color(0xFF233125))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(progress)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(color)
            )
        }
    }
}

@Composable
private fun TacticalActionTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconTint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(10.dp)),
        colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(iconTint.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TacticalTextPrimary
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextMuted,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
private fun TransactionListItem(transaction: ScanTransaction) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp)),
        colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.sku,
                    style = MaterialTheme.typography.titleSmall,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = TacticalTextPrimary
                )
                Text(
                    text = "${transaction.scanType.name.replace("_", " ")} • ${transaction.quantityDelta} units",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalTextSecondary
                )
            }

            val badgeColor = when (transaction.verificationStatus) {
                VerificationStatus.VERIFIED -> StatusVerifiedGreen
                VerificationStatus.MISMATCH -> StatusMismatchAmber
                VerificationStatus.UNREGISTERED -> StatusUnregisteredRed
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(badgeColor.copy(alpha = 0.2f))
                    .border(1.dp, badgeColor, RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = transaction.verificationStatus.name,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = badgeColor,
                    fontSize = 10.sp
                )
            }
        }
    }
}
