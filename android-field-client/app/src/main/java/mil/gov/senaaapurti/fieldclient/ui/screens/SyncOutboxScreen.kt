package mil.gov.senaaapurti.fieldclient.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity
import mil.gov.senaaapurti.fieldclient.repository.SyncRepository
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveDark
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOlivePrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.MilitaryGold
import mil.gov.senaaapurti.fieldclient.ui.theme.SafetyAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusUnregisteredRed
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusVerifiedGreen
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalCardBorder
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalSurfaceDark
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextMuted
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextPrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextSecondary
import mil.gov.senaaapurti.fieldclient.worker.SyncManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun SyncOutboxScreen(
    syncRepository: SyncRepository,
    syncManager: SyncManager
) {
    val outboxItems by syncRepository.allOutboxItems.collectAsState(initial = emptyList())
    val isOnline by syncManager.isOnline.collectAsState()
    val pendingCount by syncRepository.pendingCount.collectAsState(initial = 0)

    val dateFormat = rememberDateFormat()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // 1. Connection & Queue Overview Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, TacticalCardBorder, RoundedCornerShape(10.dp)),
            colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(if (isOnline) StatusVerifiedGreen else SafetyAmber)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isOnline) "TACTICAL LINK ONLINE" else "OFFLINE MUTATION QUEUE",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (isOnline) StatusVerifiedGreen else SafetyAmber
                        )
                    }

                    Icon(
                        imageVector = if (isOnline) Icons.Default.CloudDone else Icons.Default.CloudOff,
                        contentDescription = null,
                        tint = if (isOnline) StatusVerifiedGreen else SafetyAmber,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = if (pendingCount > 0)
                        "$pendingCount cryptographically signed mutations waiting for upload to SenaAapurti Central Backend."
                    else
                        "All local store mutations synchronized. Database is 100% consistent with central ledger.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalTextSecondary
                )

                Spacer(modifier = Modifier.height(14.dp))

                // "Force Sync Now" Button (Minimum 48dp target)
                Button(
                    onClick = { syncManager.forceSyncNow() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary)
                ) {
                    Icon(
                        imageVector = Icons.Default.Sync,
                        contentDescription = null,
                        tint = MilitaryGold,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "FORCE SYNC NOW (WORKMANAGER)",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = TacticalTextPrimary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 2. Outbox Queue List Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "MUTATION AUDIT TRAIL (${outboxItems.size} ENTRIES)",
                style = MaterialTheme.typography.labelSmall,
                color = MilitaryGold
            )
            Text(
                text = "SHA-256 SIGNED",
                style = MaterialTheme.typography.labelSmall,
                fontFamily = FontFamily.Monospace,
                color = TacticalTextMuted
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 3. Outbox Items List
        if (outboxItems.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalSurfaceDark)
                    .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Outbox is clear. All scans and inventory changes have been uploaded to the central server.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalTextMuted
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(outboxItems, key = { it.outboxId }) { item ->
                    OutboxItemCard(item = item, dateFormat = dateFormat)
                }
            }
        }
    }
}

@Composable
private fun OutboxItemCard(
    item: SyncOutboxQueueEntity,
    dateFormat: SimpleDateFormat
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp)),
        colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Action Type and Status Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.actionType,
                    style = MaterialTheme.typography.titleMedium,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = TacticalTextPrimary
                )

                val (statusColor, statusIcon) = when (item.status) {
                    "SYNCED" -> StatusVerifiedGreen to Icons.Default.CheckCircle
                    "PENDING" -> SafetyAmber to Icons.Default.Schedule
                    else -> StatusUnregisteredRed to Icons.Default.Error
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = statusIcon,
                        contentDescription = null,
                        tint = statusColor,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = item.status,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // SHA-256 Hash Badge
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFF0F1711))
                    .border(1.dp, Color(0xFF1D2F22), RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "HASH: ${item.payloadHash.take(24)}...",
                    style = MaterialTheme.typography.labelSmall,
                    fontFamily = FontFamily.Monospace,
                    color = MilitaryGold,
                    fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Timestamp and Retry Meta
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = dateFormat.format(Date(item.createdAt)),
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalTextMuted
                )
                if (item.retryCount > 0) {
                    Text(
                        text = "Retries: ${item.retryCount}",
                        style = MaterialTheme.typography.labelSmall,
                        color = SafetyAmber
                    )
                }
            }
        }
    }
}

@Composable
private fun rememberDateFormat(): SimpleDateFormat {
    return SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
}
