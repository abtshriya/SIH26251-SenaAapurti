package mil.gov.senaaapurti.fieldclient.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import mil.gov.senaaapurti.fieldclient.data.local.entity.SyncOutboxQueueEntity
import mil.gov.senaaapurti.fieldclient.repository.InventoryRepository
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
    syncManager: SyncManager,
    inventoryRepository: InventoryRepository? = null
) {
    val outboxItems by syncRepository.allOutboxItems.collectAsState(initial = emptyList())
    val isOnline by syncManager.isOnline.collectAsState()
    val pendingCount by syncRepository.pendingCount.collectAsState(initial = 0)
    val inventoryItems by inventoryRepository?.allInventoryItems?.collectAsState(initial = emptyList())
        ?: remember { mutableStateOf(emptyList()) }

    var backendUrl by remember { mutableStateOf("http://10.0.2.2:8000") }
    var syncFeedbackMessage by remember { mutableStateOf("") }
    var isSyncingNow by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf(false) }
    var generatedReportText by remember { mutableStateOf("") }

    val coroutineScope = rememberCoroutineScope()
    val clipboardManager = LocalClipboardManager.current
    val dateFormat = remember { SimpleDateFormat("dd-MMM HH:mm", Locale.US) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // --- 1. ASCON CONNECTION & QUEUE HUD CARD ---
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
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(if (isOnline) StatusVerifiedGreen else SafetyAmber)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isOnline) "TACTICAL LINK ONLINE" else "OFFLINE AUTONOMOUS QUEUE",
                            style = MaterialTheme.typography.titleSmall,
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

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = if (pendingCount > 0)
                        "$pendingCount cryptographically signed mutation(s) held in local outbox queue."
                    else
                        "All local store mutations synchronized. Database is 100% consistent with central ledger.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalTextSecondary
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Backend Host Configuration Field
                OutlinedTextField(
                    value = backendUrl,
                    onValueChange = { backendUrl = it },
                    label = { Text("Central Backend Host (FastAPI)", fontSize = 11.sp) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MilitaryGold,
                        unfocusedBorderColor = TacticalCardBorder,
                        focusedTextColor = TacticalTextPrimary,
                        unfocusedTextColor = TacticalTextPrimary,
                        focusedContainerColor = ArmyOliveDark,
                        unfocusedContainerColor = ArmyOliveDark
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Direct Force Sync Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            isSyncingNow = true
                            coroutineScope.launch {
                                val (_, msg) = syncRepository.performDirectSync(backendUrl)
                                syncFeedbackMessage = msg
                                isSyncingNow = false
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !isSyncingNow
                    ) {
                        Icon(Icons.Default.Sync, contentDescription = null, tint = MilitaryGold, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isSyncingNow) "SYNCING..." else "SYNC NOW",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = TacticalTextPrimary
                        )
                    }

                    // Generate Certified Ledger Report Button
                    Button(
                        onClick = {
                            generatedReportText = syncRepository.generateCertifiedLedgerReport(
                                outboxCount = outboxItems.size,
                                itemCount = inventoryItems.size
                            )
                            showReportDialog = true
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ArmyOliveDark),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MilitaryGold),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Description, contentDescription = null, tint = MilitaryGold, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("CERTIFIED LEDGER", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MilitaryGold)
                    }
                }

                // Sync Feedback Notice
                AnimatedVisibility(visible = syncFeedbackMessage.isNotBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = syncFeedbackMessage,
                        fontSize = 11.sp,
                        color = StatusVerifiedGreen,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // --- 2. OUTBOX MUTATION AUDIT TRAIL HEADER ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "MUTATION AUDIT TRAIL (${outboxItems.size} ENTRIES)",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MilitaryGold,
                letterSpacing = 1.sp
            )
            Text(
                text = "SHA-256 SIGNED",
                style = MaterialTheme.typography.labelSmall,
                fontFamily = FontFamily.Monospace,
                color = TacticalTextMuted
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // --- 3. OUTBOX ITEMS LIST ---
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
                    text = "Outbox is clear. All scans, indents, and stocktakes have been cryptographically verified.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalTextMuted,
                    fontSize = 12.sp
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

    // --- DIALOG: CERTIFIED REGIMENTAL LEDGER REPORT ---
    if (showReportDialog) {
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            containerColor = TacticalSurfaceDark,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Description, contentDescription = null, tint = MilitaryGold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Certified Military Ledger Report",
                        color = TacticalTextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(340.dp)
                        .verticalScroll(rememberScrollState())
                        .background(Color(0xFF090E0A))
                        .padding(10.dp)
                ) {
                    Text(
                        text = generatedReportText,
                        color = StatusVerifiedGreen,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 9.sp,
                        lineHeight = 13.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        clipboardManager.setText(AnnotatedString(generatedReportText))
                        syncFeedbackMessage = "Certified Ledger copied to clipboard."
                        showReportDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary)
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Copy Report", color = Color.White)
                }
            },
            dismissButton = {
                Button(
                    onClick = { showReportDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                ) {
                    Text("Close", color = TacticalTextMuted)
                }
            }
        )
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.actionType.replace("_", " "),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TacticalTextPrimary
                )

                val (badgeBg, badgeFg, badgeText) = when (item.status) {
                    "SYNCED" -> Triple(StatusVerifiedGreen.copy(alpha = 0.2f), StatusVerifiedGreen, "SYNCED")
                    "PENDING" -> Triple(SafetyAmber.copy(alpha = 0.2f), SafetyAmber, "PENDING")
                    "FAILED" -> Triple(StatusUnregisteredRed.copy(alpha = 0.2f), StatusUnregisteredRed, "FAILED")
                    else -> Triple(Color.Gray.copy(alpha = 0.2f), Color.Gray, item.status)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(badgeBg)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = badgeText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeFg
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "SHA-256: ${item.payloadHash.take(18)}...${item.payloadHash.takeLast(6)}",
                style = MaterialTheme.typography.labelSmall,
                fontFamily = FontFamily.Monospace,
                color = MilitaryGold,
                fontSize = 10.sp
            )

            Text(
                text = "Payload: ${item.payloadJson.take(65)}...",
                style = MaterialTheme.typography.bodySmall,
                color = TacticalTextMuted,
                fontSize = 10.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Logged: ${dateFormat.format(Date(item.createdAt))}",
                style = MaterialTheme.typography.labelSmall,
                color = TacticalTextSecondary,
                fontSize = 9.sp
            )
        }
    }
}
