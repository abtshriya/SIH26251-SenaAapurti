package mil.gov.senaaapurti.fieldclient.ui.screens

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
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
    onNavigateToSync: () -> Unit
) {
    val isOnline by syncManager.isOnline.collectAsState()
    val pendingOutboxCount by syncRepository.pendingCount.collectAsState(initial = 0)
    val inventoryItems by inventoryRepository.allInventoryItems.collectAsState(initial = emptyList())
    val recentTransactions by scanRepository.recentTransactions.collectAsState(initial = emptyList())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Tactical HUD Header & Authority Banner
        item {
            MilitaryAuthorityBanner()
        }

        // 2. Device Status HUD (Online/Offline, Cache Items, Pending Outbox)
        item {
            DeviceStatusHudCard(
                isOnline = isOnline,
                cacheCount = inventoryItems.size,
                pendingOutbox = pendingOutboxCount,
                onSyncClick = onNavigateToSync
            )
        }

        // 3. Quick Action Tiles (48dp+ min targets for combat gloves)
        item {
            Text(
                text = "TACTICAL OPERATIONS",
                style = MaterialTheme.typography.labelSmall,
                color = MilitaryGold,
                modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TacticalActionTile(
                    title = "Quick Inward",
                    subtitle = "Receipt (+)",
                    icon = Icons.Default.QrCodeScanner,
                    iconTint = StatusVerifiedGreen,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateToScanner(ScanType.INWARD_RECEIPT) }
                )
                TacticalActionTile(
                    title = "Dispatch Verify",
                    subtitle = "Outward (-)",
                    icon = Icons.Default.LocalShipping,
                    iconTint = SafetyAmber,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateToScanner(ScanType.DISPATCH_VERIFY) }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TacticalActionTile(
                    title = "Stock Audit",
                    subtitle = "Physical Count",
                    icon = Icons.Default.FactCheck,
                    iconTint = MilitaryGold,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToInventory
                )
                TacticalActionTile(
                    title = "Sync Outbox",
                    subtitle = "$pendingOutboxCount Queued",
                    icon = Icons.Default.Sync,
                    iconTint = if (pendingOutboxCount > 0) SafetyAmber else TacticalTextMuted,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToSync
                )
            }
        }

        // 4. Recent Local Field Transactions
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "RECENT FIELD TRANSACTIONS",
                    style = MaterialTheme.typography.labelSmall,
                    color = MilitaryGold
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
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp)),
                    colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
                ) {
                    Text(
                        text = "No recent field transactions. Tap 'Quick Inward' or trigger physical scan button to start.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TacticalTextMuted,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(recentTransactions.take(8)) { tx ->
                TransactionListItem(transaction = tx)
            }
        }
    }
}

@Composable
private fun MilitaryAuthorityBanner() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(ArmyOliveDark)
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "SENAAAPURTI FIELD CLIENT",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TacticalTextPrimary
            )
            Text(
                text = "OFFICIAL RUGGED TERMINAL APK • V3.4.1",
                style = MaterialTheme.typography.labelSmall,
                color = TacticalTextMuted
            )
        }

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .background(ArmyOlivePrimary)
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                text = "DGOS C4ISR",
                style = MaterialTheme.typography.labelSmall,
                color = MilitaryGold,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun DeviceStatusHudCard(
    isOnline: Boolean,
    cacheCount: Int,
    pendingOutbox: Int,
    onSyncClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(10.dp)),
        colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Online/Offline Status Indicator
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (isOnline) StatusVerifiedGreen else SafetyAmber)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isOnline) "ONLINE • TACTICAL DATALINK" else "OFFLINE MODE • LOCAL STORE",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isOnline) StatusVerifiedGreen else SafetyAmber
                    )
                }

                Icon(
                    imageVector = if (isOnline) Icons.Default.CloudDone else Icons.Default.CloudOff,
                    contentDescription = null,
                    tint = if (isOnline) StatusVerifiedGreen else SafetyAmber,
                    modifier = Modifier.size(18.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "LOCAL CATALOG",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalTextMuted
                    )
                    Text(
                        text = "$cacheCount SKUs",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TacticalTextPrimary
                    )
                }

                Column {
                    Text(
                        text = "DEVICE NODE",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalTextMuted
                    )
                    Text(
                        text = "FOB-ALPHA",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TacticalTextPrimary
                    )
                }

                Column(
                    horizontalAlignment = Alignment.End,
                    modifier = Modifier.clickable { onSyncClick() }
                ) {
                    Text(
                        text = "OUTBOX QUEUE",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalTextMuted
                    )
                    Text(
                        text = "$pendingOutbox PENDING",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (pendingOutbox > 0) SafetyAmber else StatusVerifiedGreen
                    )
                }
            }
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
            .height(104.dp)
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TacticalTextPrimary
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextSecondary
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
                    style = MaterialTheme.typography.titleMedium,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = TacticalTextPrimary
                )
                Text(
                    text = "${transaction.scanType.name} • ${transaction.quantityDelta} units",
                    style = MaterialTheme.typography.bodyMedium,
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
