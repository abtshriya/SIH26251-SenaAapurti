package mil.gov.senaaapurti.fieldclient.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.FlashlightOn
import androidx.compose.material.icons.filled.Keyboard
import androidx.compose.material.icons.filled.Nightlight
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import mil.gov.senaaapurti.fieldclient.data.model.ScanType
import mil.gov.senaaapurti.fieldclient.data.model.ScanVerificationResult
import mil.gov.senaaapurti.fieldclient.hardware.RuggedScannerHardwareManager
import mil.gov.senaaapurti.fieldclient.repository.ScanRepository
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveDark
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOlivePrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.MilitaryGold
import mil.gov.senaaapurti.fieldclient.ui.theme.NightVisionRed
import mil.gov.senaaapurti.fieldclient.ui.theme.NightVisionRedBright
import mil.gov.senaaapurti.fieldclient.ui.theme.SafetyAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusMismatchAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusUnregisteredRed
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusVerifiedGreen
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalCardBorder
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalSurfaceDark
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextMuted
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextPrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextSecondary

@Composable
fun ScannerScreen(
    initialScanType: ScanType = ScanType.INWARD_RECEIPT,
    scanRepository: ScanRepository,
    hardwareManager: RuggedScannerHardwareManager,
    isNightVisionMode: Boolean,
    onToggleNightVision: () -> Unit
) {
    var selectedScanType by remember { mutableStateOf(initialScanType) }
    var batchCount by remember { mutableIntStateOf(0) }
    var latestResult by remember { mutableStateOf<ScanVerificationResult?>(null) }
    var manualInputCode by remember { mutableStateOf("") }
    var showManualInputDialog by remember { mutableStateOf(false) }
    var isTorchActive by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()

    // Sample barcode cycle for hardware/test triggering
    val sampleBarcodes = remember {
        listOf(
            "8901234500018", // MUN-155MM-HE
            "8901234500025", // MUN-762-NATO
            "8901234500032", // RAT-MRE-HALT
            "8901234500049", // FUEL-JP8-ARC
            "8901234500056", // MED-IFAK-TRAUMA
            "9999999999999"  // Unregistered tag
        )
    }

    // Function to execute a scan action
    fun executeScan(code: String) {
        coroutineScope.launch {
            val result = scanRepository.processScan(
                scannedCode = code,
                scanType = selectedScanType,
                quantity = 1
            )
            latestResult = result
            batchCount++

            // Hardware Tactile / Audio Confirmation
            when (result) {
                is ScanVerificationResult.Verified -> hardwareManager.notifySuccess()
                is ScanVerificationResult.Mismatch -> hardwareManager.notifyWarning()
                is ScanVerificationResult.Unregistered -> hardwareManager.notifyError()
            }

            // Auto-hide verification pill after 4 seconds
            delay(4000)
            if (latestResult == result) {
                latestResult = null
            }
        }
    }

    // Listen to physical scan trigger buttons on rugged terminals
    LaunchedEffect(Unit) {
        hardwareManager.hardwareScanTrigger.collect {
            // Emulate scanning next tag in batch
            val nextSample = sampleBarcodes[(batchCount) % sampleBarcodes.size]
            executeScan(nextSample)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(if (isNightVisionMode) Color.Black else MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        // 1. Top Mode Selector Tabs (Inward / Dispatch / Audit)
        TabRow(
            selectedTabIndex = selectedScanType.ordinal,
            containerColor = TacticalSurfaceDark,
            contentColor = TacticalTextPrimary,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedScanType.ordinal]),
                    color = if (isNightVisionMode) NightVisionRedBright else MilitaryGold,
                    height = 3.dp
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp))
        ) {
            ScanType.values().forEach { scanType ->
                Tab(
                    selected = selectedScanType == scanType,
                    onClick = { selectedScanType = scanType },
                    text = {
                        Text(
                            text = when (scanType) {
                                ScanType.INWARD_RECEIPT -> "INWARD (+)"
                                ScanType.DISPATCH_VERIFY -> "DISPATCH (-)"
                                ScanType.PHYSICAL_AUDIT -> "AUDIT (COUNT)"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (selectedScanType == scanType) {
                                if (isNightVisionMode) NightVisionRedBright else MilitaryGold
                            } else TacticalTextMuted
                        )
                    },
                    modifier = Modifier.height(48.dp) // Gloved touch target
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 2. Viewfinder & Reticle Tactical Overlay Area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(if (isNightVisionMode) Color(0xFF140505) else Color(0xFF0F1511))
                .border(
                    2.dp,
                    if (isNightVisionMode) NightVisionRed else TacticalCardBorder,
                    RoundedCornerShape(12.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            // Viewfinder Target Brackets (Tactical HUD)
            ViewfinderReticle(isNightVision = isNightVisionMode)

            // Center Instructional HUD
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = "RAPID BATCH SCANNER",
                    style = MaterialTheme.typography.titleMedium,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = if (isNightVisionMode) NightVisionRedBright else MilitaryGold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Hardware Button Ready • Align Barcode / QR / Tag",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalTextSecondary,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Simulated Trigger Button for non-hardware environments
                Button(
                    onClick = {
                        val nextSample = sampleBarcodes[(batchCount) % sampleBarcodes.size]
                        executeScan(nextSample)
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isNightVisionMode) NightVisionRed else ArmyOlivePrimary
                    ),
                    modifier = Modifier.height(50.dp)
                ) {
                    Text(
                        text = "TRIGGER TEST SCAN",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Top Quick Control Icons (Torch & Night Mode)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Batch Count Pill
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.Black.copy(alpha = 0.6f))
                        .border(1.dp, TacticalCardBorder, RoundedCornerShape(16.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "BATCH: $batchCount SCANS",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = FontFamily.Monospace,
                        color = TacticalTextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Controls
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(
                        onClick = {
                            isTorchActive = hardwareManager.toggleTacticalTorch()
                        },
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(if (isTorchActive) SafetyAmber else Color.Black.copy(alpha = 0.6f))
                    ) {
                        Icon(
                            imageVector = Icons.Default.FlashlightOn,
                            contentDescription = "Toggle Tactical Flashlight",
                            tint = if (isTorchActive) Color.Black else TacticalTextPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    IconButton(
                        onClick = onToggleNightVision,
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(if (isNightVisionMode) NightVisionRed else Color.Black.copy(alpha = 0.6f))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Nightlight,
                            contentDescription = "Toggle Low-Light Night Mode",
                            tint = TacticalTextPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Bottom Floating Visual Verification Pill
            androidx.compose.animation.AnimatedVisibility(
                visible = latestResult != null,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            ) {
                val result = latestResult
                if (result != null) {
                    ScanVerificationPill(result = result)
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 3. Manual Keypad Fallback Toggle (for damaged or mud-covered labels)
        if (!showManualInputDialog) {
            Button(
                onClick = { showManualInputDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = TacticalSurfaceDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.Keyboard,
                    contentDescription = null,
                    tint = MilitaryGold,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "MANUAL SKU / BARCODE KEYPAD ENTRY",
                    style = MaterialTheme.typography.labelLarge,
                    color = TacticalTextPrimary
                )
            }
        } else {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, TacticalCardBorder, RoundedCornerShape(8.dp)),
                colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "MANUAL TAG ENTRY (DEGRADED LABEL FALLBACK)",
                        style = MaterialTheme.typography.labelSmall,
                        color = MilitaryGold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = manualInputCode,
                            onValueChange = { manualInputCode = it },
                            placeholder = { Text("e.g. MUN-155MM-HE or 890123...", color = TacticalTextMuted) },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ArmyOlivePrimary,
                                unfocusedBorderColor = TacticalCardBorder,
                                focusedTextColor = TacticalTextPrimary,
                                unfocusedTextColor = TacticalTextPrimary
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (manualInputCode.isNotBlank()) {
                                    executeScan(manualInputCode.trim())
                                    manualInputCode = ""
                                    showManualInputDialog = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ArmyOlivePrimary),
                            modifier = Modifier.height(52.dp)
                        ) {
                            Text("SUBMIT")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ViewfinderReticle(isNightVision: Boolean) {
    val reticleColor = if (isNightVision) NightVisionRedBright else MilitaryGold
    Box(
        modifier = Modifier
            .size(240.dp, 160.dp)
            .border(1.5.dp, reticleColor.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
    ) {
        // Center laser alignment indicator
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.5.dp)
                .background(reticleColor.copy(alpha = 0.4f))
                .align(Alignment.Center)
        )
    }
}

@Composable
private fun ScanVerificationPill(result: ScanVerificationResult) {
    val (pillColor, icon, title, subtitle) = when (result) {
        is ScanVerificationResult.Verified -> Quadruple(
            StatusVerifiedGreen,
            Icons.Default.CheckCircle,
            result.message,
            "${result.item.itemName} (${result.item.sku})"
        )
        is ScanVerificationResult.Mismatch -> Quadruple(
            StatusMismatchAmber,
            Icons.Default.Warning,
            result.message,
            "${result.item.itemName} - Expected ${result.expectedQty}, Got ${result.scannedQty}"
        )
        is ScanVerificationResult.Unregistered -> Quadruple(
            StatusUnregisteredRed,
            Icons.Default.Error,
            result.message,
            "Barcode: ${result.scannedBarcode}"
        )
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFF141A15))
            .border(1.5.dp, pillColor, RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = pillColor,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = pillColor,
                    fontSize = 13.sp
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalTextPrimary,
                    fontSize = 12.sp
                )
            }
        }
    }
}

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
