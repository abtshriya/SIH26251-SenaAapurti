package mil.gov.senaaapurti.fieldclient.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import mil.gov.senaaapurti.fieldclient.data.model.InventoryItem
import mil.gov.senaaapurti.fieldclient.repository.InventoryRepository
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

@Composable
fun InventoryListScreen(
    inventoryRepository: InventoryRepository
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("ALL") }
    val coroutineScope = rememberCoroutineScope()

    val categories = listOf("ALL", "MUNITIONS", "RATIONS", "POL", "MEDICAL", "SPARES", "EQUIPMENT")

    val itemsList by if (searchQuery.isNotBlank()) {
        inventoryRepository.searchItems(searchQuery).collectAsState(initial = emptyList())
    } else {
        inventoryRepository.getItemsByCategory(selectedCategory).collectAsState(initial = emptyList())
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // 1. Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search by SKU, Barcode, or Store Name...", color = TacticalTextMuted) },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    tint = MilitaryGold
                )
            },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = ArmyOlivePrimary,
                unfocusedBorderColor = TacticalCardBorder,
                focusedTextColor = TacticalTextPrimary,
                unfocusedTextColor = TacticalTextPrimary,
                focusedContainerColor = TacticalSurfaceDark,
                unfocusedContainerColor = TacticalSurfaceDark
            ),
            shape = RoundedCornerShape(8.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        // 2. Category Filter Chips (Horizontal Scroll)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categories.forEach { cat ->
                val isSelected = selectedCategory == cat
                Box(
                    modifier = Modifier
                        .height(38.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isSelected) ArmyOlivePrimary else TacticalSurfaceDark)
                        .border(
                            1.dp,
                            if (isSelected) MilitaryGold else TacticalCardBorder,
                            RoundedCornerShape(20.dp)
                        )
                        .clickable {
                            selectedCategory = cat
                            searchQuery = "" // Clear text search when switching category
                        }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = cat,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) MilitaryGold else TacticalTextSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 3. Header Counter
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "STORE CATALOGUE (${itemsList.size} ITEMS)",
                style = MaterialTheme.typography.labelSmall,
                color = MilitaryGold
            )
            Text(
                text = "OFFLINE DATABASE SYNCED",
                style = MaterialTheme.typography.labelSmall,
                color = TacticalTextMuted
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 4. Inventory Item Cards List
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(itemsList, key = { it.sku }) { item ->
                InventoryItemCard(
                    item = item,
                    onAdjustStock = { delta ->
                        coroutineScope.launch {
                            inventoryRepository.adjustStock(item.sku, delta)
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun InventoryItemCard(
    item: InventoryItem,
    onAdjustStock: (Int) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(10.dp)),
        colors = CardDefaults.cardColors(containerColor = TacticalSurfaceDark)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Item Name & Category Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.itemName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TacticalTextPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "SKU: ${item.sku} • BARCODE: ${item.barcode}",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = FontFamily.Monospace,
                        color = TacticalTextSecondary
                    )
                }

                // Category Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFF142419))
                        .border(1.dp, ArmyOlivePrimary, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = item.category,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MilitaryGold,
                        fontSize = 10.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Quantities & Location Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Current Stock
                Column {
                    Text(
                        text = "CURRENT STOCK",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalTextMuted
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "${item.currentStock} ${item.unitOfMeasure}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (item.isCriticalShortage) StatusUnregisteredRed else StatusVerifiedGreen
                        )
                        if (item.isCriticalShortage) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = "Critical Shortage",
                                tint = StatusUnregisteredRed,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }

                // Days of Supply (DOS)
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "EST. DOS",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalTextMuted
                    )
                    Text(
                        text = "${item.daysOfSupply.toInt()} Days",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (item.daysOfSupply < 15) SafetyAmber else TacticalTextPrimary
                    )
                }

                // Bin Location
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "BIN LOCATION",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalTextMuted
                    )
                    Text(
                        text = item.binLocation,
                        style = MaterialTheme.typography.titleMedium,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = MilitaryGold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Quick Stock Reconciliation Steppers (48dp Touch Targets for Combat Gloves)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Step -10
                StepperButton(text = "-10", onClick = { onAdjustStock(-10) }, modifier = Modifier.weight(1f))
                // Step -1
                StepperButton(text = "-1", onClick = { onAdjustStock(-1) }, modifier = Modifier.weight(1f))
                // Step +1
                StepperButton(text = "+1", onClick = { onAdjustStock(1) }, modifier = Modifier.weight(1f))
                // Step +10
                StepperButton(text = "+10", onClick = { onAdjustStock(10) }, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StepperButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(48.dp) // Minimum 48dp for gloved hands
            .clip(RoundedCornerShape(6.dp))
            .background(Color(0xFF223025))
            .border(1.dp, TacticalCardBorder, RoundedCornerShape(6.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            color = TacticalTextPrimary
        )
    }
}
