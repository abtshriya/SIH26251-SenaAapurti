package mil.gov.senaaapurti.fieldclient.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val TacticalDarkColorScheme = darkColorScheme(
    primary = ArmyOlivePrimary,
    onPrimary = TacticalTextPrimary,
    primaryContainer = ArmyOliveDark,
    onPrimaryContainer = TacticalTextPrimary,
    secondary = SafetyAmber,
    onSecondary = TacticalTextPrimary,
    tertiary = MilitaryGold,
    background = TacticalCanvasDark,
    onBackground = TacticalTextPrimary,
    surface = TacticalSurfaceDark,
    onSurface = TacticalTextPrimary,
    surfaceVariant = ArmyOliveSurface,
    onSurfaceVariant = TacticalTextSecondary,
    outline = TacticalCardBorder,
    error = StatusUnregisteredRed
)

private val NightVisionColorScheme = darkColorScheme(
    primary = NightVisionRed,
    onPrimary = TacticalTextPrimary,
    primaryContainer = NightVisionSurface,
    onPrimaryContainer = NightVisionRedBright,
    secondary = NightVisionRedBright,
    onSecondary = TacticalTextPrimary,
    background = NightVisionDark,
    onBackground = NightVisionRedBright,
    surface = NightVisionSurface,
    onSurface = NightVisionRedBright,
    surfaceVariant = NightVisionSurface,
    onSurfaceVariant = NightVisionRed,
    outline = NightVisionRed,
    error = NightVisionRedBright
)

@Composable
fun SenaFieldTheme(
    isNightVisionMode: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (isNightVisionMode) NightVisionColorScheme else TacticalDarkColorScheme

    val view = androidx.compose.ui.platform.LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? android.app.Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.background.toArgb()
                window.navigationBarColor = colorScheme.background.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TacticalTypography,
        content = content
    )
}
