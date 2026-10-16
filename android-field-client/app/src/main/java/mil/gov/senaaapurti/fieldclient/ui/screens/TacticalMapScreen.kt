package mil.gov.senaaapurti.fieldclient.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mil.gov.senaaapurti.fieldclient.data.local.entity.ConvoyEntity
import mil.gov.senaaapurti.fieldclient.repository.OperationsRepository
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOliveDark
import mil.gov.senaaapurti.fieldclient.ui.theme.ArmyOlivePrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.MilitaryGold
import mil.gov.senaaapurti.fieldclient.ui.theme.SafetyAmber
import mil.gov.senaaapurti.fieldclient.ui.theme.StatusVerifiedGreen
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalCardBorder
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalSurfaceDark
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextMuted
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextPrimary
import mil.gov.senaaapurti.fieldclient.ui.theme.TacticalTextSecondary

data class StrategicMapNode(
    val id: String,
    val name: String,
    val echelons: String,
    val lat: Float,
    val lon: Float,
    val isHQ: Boolean = false,
    val isForward: Boolean = false,
    val readiness: String = "98.2%"
)

@Composable
fun TacticalMapScreen(
    operationsRepository: OperationsRepository,
    onNavigateToConvoyDetails: ((String) -> Unit)? = null
) {
    val convoys by operationsRepository.allConvoys.collectAsState(initial = emptyList())
    val corridors by operationsRepository.allCorridors.collectAsState(initial = emptyList())

    var showCorridors by remember { mutableStateOf(true) }
    var showConvoys by remember { mutableStateOf(true) }
    var showHazards by remember { mutableStateOf(true) }

    var selectedNode by remember { mutableStateOf<StrategicMapNode?>(null) }
    var selectedConvoy by remember { mutableStateOf<ConvoyEntity?>(null) }

    // Canvas Transformation State (Pan & Pinch-Zoom)
    var scale by remember { mutableFloatStateOf(1.0f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    // Strategic Defense Nodes
    val nodes = remember {
        listOf(
            StrategicMapNode("AHQ", "Army HQ (Sena Bhawan)", "Integrated Defense Staff", 28.6139f, 77.2090f, isHQ = true),
            StrategicMapNode("NC", "Northern Command", "14, 15, 16 Corps • Udhampur", 32.9250f, 75.1400f, isHQ = true),
            StrategicMapNode("WC", "Western Command", "2, 9, 11 Corps • Chandimandir", 30.7200f, 76.8800f, isHQ = true),
            StrategicMapNode("EC", "Eastern Command", "3, 4, 33 Corps • Fort William", 22.5500f, 88.3300f, isHQ = true),
            StrategicMapNode("LEH", "14 Corps HQ & Base Depot", "Fire & Fury • Leh Ladakh", 34.1526f, 77.5771f, isForward = true),
            StrategicMapNode("SXR", "15 Corps Forward Depot", "Chinar Corps • Srinagar", 34.0837f, 74.7973f, isForward = true),
            StrategicMapNode("KRG", "Kargil Forward Sector", "8 Mountain Division", 34.5539f, 76.1349f, isForward = true),
            StrategicMapNode("SIA", "Siachen Base Camp", "102 Infantry Brigade • 12,000 ft", 35.2000f, 77.1000f, isForward = true),
            StrategicMapNode("DBO", "Daulat Beg Oldie (DBO)", "Sub-Sector North • 16,614 ft", 35.4167f, 77.9333f, isForward = true)
        )
    }

    // Coordinate Normalizer (India focus: Lat 20..37, Lon 72..90)
    fun projectCoordinates(lat: Float, lon: Float, width: Float, height: Float): Offset {
        val minLat = 21.0f
        val maxLat = 36.5f
        val minLon = 72.0f
        val maxLon = 89.0f

        val normX = (lon - minLon) / (maxLon - minLon)
        val normY = 1.0f - ((lat - minLat) / (maxLat - minLat))

        val basePadding = 40f
        val renderW = width - (basePadding * 2)
        val renderH = height - (basePadding * 2)

        val canvasX = (basePadding + (normX * renderW)) * scale + offsetX
        val canvasY = (basePadding + (normY * renderH)) * scale + offsetY

        return Offset(canvasX, canvasY)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0C130E))
    ) {
        // --- 1. INTERACTIVE TACTICAL CANVAS ---
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        scale = (scale * zoom).coerceIn(0.7f, 3.5f)
                        offsetX += pan.x
                        offsetY += pan.y
                    }
                }
        ) {
            val width = size.width
            val height = size.height

            // Background Tactical Grid Lines
            val gridStep = 60.dp.toPx() * scale
            val gridColor = Color(0x15356E42)
            var curX = (offsetX % gridStep)
            while (curX < width) {
                drawLine(gridColor, Offset(curX, 0f), Offset(curX, height), strokeWidth = 1f)
                curX += gridStep
            }
            var curY = (offsetY % gridStep)
            while (curY < height) {
                drawLine(gridColor, Offset(0f, curY), Offset(width, curY), strokeWidth = 1f)
                curY += gridStep
            }

            // Projected Node Positions Map
            val projectedMap = nodes.associate { it.id to projectCoordinates(it.lat, it.lon, width, height) }

            // Strategic Transit Corridors (Dashed Golden Lines)
            if (showCorridors) {
                val corridorsList = listOf(
                    listOf("AHQ", "WC", "NC", "SXR", "KRG", "LEH", "SIA"),
                    listOf("WC", "LEH"),
                    listOf("LEH", "DBO"),
                    listOf("AHQ", "EC")
                )

                val corridorPathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f), 0f)

                for (corridor in corridorsList) {
                    for (i in 0 until corridor.size - 1) {
                        val p1 = projectedMap[corridor[i]] ?: continue
                        val p2 = projectedMap[corridor[i + 1]] ?: continue

                        // Outer Glow
                        drawLine(
                            color = Color(0x30D4AF37),
                            start = p1,
                            end = p2,
                            strokeWidth = 6f * scale
                        )
                        // Core Dashed Line
                        drawLine(
                            color = MilitaryGold,
                            start = p1,
                            end = p2,
                            strokeWidth = 2.5f * scale,
                            pathEffect = corridorPathEffect
                        )
                    }
                }
            }

            // Avalanche & Weather Hazard Zones (Pulsing rings around Zojila / Kargil)
            if (showHazards) {
                val zojilaPoint = projectedMap["KRG"]?.let { Offset(it.x - (25f * scale), it.y + (10f * scale)) }
                zojilaPoint?.let { pt ->
                    drawCircle(
                        color = Color(0x28E53E3E),
                        radius = 45f * scale,
                        center = pt
                    )
                    drawCircle(
                        color = Color(0x80E53E3E),
                        radius = 35f * scale,
                        center = pt,
                        style = Stroke(width = 2f * scale, pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f))
                    )
                }

                val khardungPoint = projectedMap["LEH"]?.let { Offset(it.x + (15f * scale), it.y - (30f * scale)) }
                khardungPoint?.let { pt ->
                    drawCircle(
                        color = Color(0x25DD6B20),
                        radius = 36f * scale,
                        center = pt
                    )
                }
            }

            // Draw Nodes
            for (node in nodes) {
                val pt = projectedMap[node.id] ?: continue

                if (node.isHQ) {
                    // Headquarters: Blue Military Star / Diamond
                    val sizeDiamond = 14f * scale
                    val path = Path().apply {
                        moveTo(pt.x, pt.y - sizeDiamond)
                        lineTo(pt.x + sizeDiamond, pt.y)
                        lineTo(pt.x, pt.y + sizeDiamond)
                        lineTo(pt.x - sizeDiamond, pt.y)
                        close()
                    }
                    drawPath(path, color = Color(0xFF1E3A8A))
                    drawPath(path, color = Color(0xFF60A5FA), style = Stroke(width = 2f * scale))
                    drawCircle(Color(0xFF93C5FD), radius = 3.5f * scale, center = pt)
                } else if (node.isForward) {
                    // Forward Himalayan Pickets / Depots: Glowing Green Tactical Rings
                    drawCircle(Color(0x352E8540), radius = 18f * scale, center = pt)
                    drawCircle(StatusVerifiedGreen, radius = 7f * scale, center = pt)
                    drawCircle(Color(0xFF86EFAC), radius = 2.5f * scale, center = pt)
                } else {
                    drawCircle(ArmyOlivePrimary, radius = 6f * scale, center = pt)
                    drawCircle(MilitaryGold, radius = 6f * scale, center = pt, style = Stroke(width = 1.5f))
                }
            }

            // Draw Convoys
            if (showConvoys) {
                val convoyPositions = listOf(
                    Offset(projectedMap["LEH"]!!.x - (30f * scale), projectedMap["LEH"]!!.y + (40f * scale)),
                    Offset(projectedMap["KRG"]!!.x + (15f * scale), projectedMap["KRG"]!!.y - (10f * scale)),
                    Offset(projectedMap["SIA"]!!.x - (10f * scale), projectedMap["SIA"]!!.y + (20f * scale))
                )

                for (pt in convoyPositions) {
                    drawCircle(SafetyAmber, radius = 10f * scale, center = pt)
                    drawCircle(Color.White, radius = 4f * scale, center = pt)
                    drawCircle(Color(0x40DD6B20), radius = 20f * scale, center = pt)
                }
            }
        }

        // --- 2. TOP FILTER STRIP ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = showCorridors,
                onClick = { showCorridors = !showCorridors },
                label = { Text("Corridors", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = ArmyOlivePrimary,
                    selectedLabelColor = Color.White
                )
            )
            FilterChip(
                selected = showConvoys,
                onClick = { showConvoys = !showConvoys },
                label = { Text("Convoys", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = SafetyAmber,
                    selectedLabelColor = Color.White
                )
            )
            FilterChip(
                selected = showHazards,
                onClick = { showHazards = !showHazards },
                label = { Text("Hazards", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = Color(0xFFC53030),
                    selectedLabelColor = Color.White
                )
            )
        }

        // --- 3. FLOATING MAP CONTROLS ---
        Column(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 60.dp, end = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FloatingActionButton(
                onClick = { scale = (scale * 1.25f).coerceAtMost(3.5f) },
                modifier = Modifier.size(40.dp),
                containerColor = TacticalSurfaceDark,
                contentColor = MilitaryGold
            ) {
                Icon(Icons.Default.Add, contentDescription = "Zoom In", modifier = Modifier.size(18.dp))
            }
            FloatingActionButton(
                onClick = { scale = (scale / 1.25f).coerceAtLeast(0.7f) },
                modifier = Modifier.size(40.dp),
                containerColor = TacticalSurfaceDark,
                contentColor = MilitaryGold
            ) {
                Icon(Icons.Default.Remove, contentDescription = "Zoom Out", modifier = Modifier.size(18.dp))
            }
            FloatingActionButton(
                onClick = {
                    scale = 1.0f
                    offsetX = 0f
                    offsetY = 0f
                },
                modifier = Modifier.size(40.dp),
                containerColor = TacticalSurfaceDark,
                contentColor = StatusVerifiedGreen
            ) {
                Icon(Icons.Default.MyLocation, contentDescription = "Recenter", modifier = Modifier.size(18.dp))
            }
        }

        // --- 4. TACTICAL TELEMETRY HUD DOSSIER (BOTTOM CARDS) ---
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // Convoy Live Card (Default or Selected)
            val featuredConvoy = selectedConvoy ?: convoys.firstOrNull()
            featuredConvoy?.let { cnv ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(TacticalCardBorder)),
                    shape = RoundedCornerShape(12.dp)
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
                                        text = "CONVOY: ${cnv.callSign}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = TacticalTextPrimary
                                    )
                                    Text(
                                        text = "${cnv.vehicleCount} Vehicles • ${cnv.tonnage} Tonnes Payload",
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
                            text = "Axis: ${cnv.routeName}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalTextSecondary,
                            maxLines = 1
                        )
                        Text(
                            text = "ETA: ${cnv.eta} • Last: ${cnv.lastCheckpoint}",
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
                    }
                }
            }
        }
    }
}
