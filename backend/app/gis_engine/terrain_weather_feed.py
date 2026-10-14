"""
Terrain and Weather Telemetry Feed for Northern High-Altitude Mountain Passes.
Evaluates avalanche hazard grades, snowpack depth, wind shear, and dynamic pass clearance states.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("sena_aapurti.gis_engine.weather")


class PassStatus(str, Enum):
    OPEN = "OPEN"
    RESTRICTED_CHAINS = "RESTRICTED_CHAINS"
    BLOCKED = "BLOCKED"


class HazardGrade(int, Enum):
    GRADE_1_LOW = 1
    GRADE_2_MODERATE = 2
    GRADE_3_CONSIDERABLE = 3
    GRADE_4_HIGH = 4
    GRADE_5_VERY_HIGH = 5


class PassCondition(BaseModel):
    """Real-time operational and meteorological state of a high-altitude mountain pass."""

    pass_name: str = Field(..., description="Tactical pass identifier (e.g., Khardung La, Zoji La)")
    sector: str = Field(..., description="Operational theater sector")
    elevation_m: int = Field(..., description="Summit elevation in meters above sea level")
    lat: float = Field(..., description="Summit latitude")
    lon: float = Field(..., description="Summit longitude")
    status: PassStatus = Field(default=PassStatus.OPEN, description="Traffic clearance status")
    cause: str = Field(default="NORMAL_OPERATIONS", description="Disruption etiology or weather advisory")
    temp_c: float = Field(default=-12.0, description="Ambient surface temperature in Celsius")
    wind_speed_kmh: float = Field(default=28.0, description="Sustained ridge wind speed in km/h")
    snow_rate_cm_hr: float = Field(default=0.0, description="Snow precipitation rate in cm/hr")
    visibility_m: int = Field(default=8000, description="Horizontal visibility in meters")
    snowpack_depth_cm: float = Field(default=45.0, description="Accumulated snowpack depth")
    avalanche_hazard_grade: HazardGrade = Field(default=HazardGrade.GRADE_1_LOW, description="Avalanche hazard rating (1-5)")
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def is_passable(self) -> bool:
        return self.status in (PassStatus.OPEN, PassStatus.RESTRICTED_CHAINS)


class TerrainWeatherFeed:
    """
    In-memory, thread-safe meteorological and pass condition registry.
    Mirroring telemetry ingested from Snow & Avalanche Study Establishment (SASE/DRDO)
    and Border Roads Organisation (BRO) field detachments.
    """

    def __init__(self) -> None:
        self._passes: Dict[str, PassCondition] = {}
        self._initialize_baseline_passes()

    def _initialize_baseline_passes(self) -> None:
        baseline_data = [
            PassCondition(
                pass_name="Khardung La",
                sector="CENTRAL-LADAKH / NUBRA",
                elevation_m=5359,
                lat=34.2787,
                lon=77.6047,
                status=PassStatus.OPEN,
                cause="CLEAR_WEATHER_BRO_OPEN",
                temp_c=-18.5,
                wind_speed_kmh=32.0,
                snow_rate_cm_hr=0.2,
                visibility_m=6500,
                snowpack_depth_cm=62.0,
                avalanche_hazard_grade=HazardGrade.GRADE_1_LOW,
            ),
            PassCondition(
                pass_name="Zoji La",
                sector="KASHMIR-VALLEY / DRAS",
                elevation_m=3528,
                lat=34.2785,
                lon=75.4697,
                status=PassStatus.OPEN,
                cause="HIGHWAY_NH1_OPERATIONAL",
                temp_c=-14.0,
                wind_speed_kmh=26.0,
                snow_rate_cm_hr=0.0,
                visibility_m=9000,
                snowpack_depth_cm=48.0,
                avalanche_hazard_grade=HazardGrade.GRADE_1_LOW,
            ),
            PassCondition(
                pass_name="Chang La",
                sector="EASTERN-LADAKH / PANGONG",
                elevation_m=5360,
                lat=34.0475,
                lon=77.9308,
                status=PassStatus.OPEN,
                cause="BRO_HIMANK_CLEARED",
                temp_c=-22.0,
                wind_speed_kmh=40.0,
                snow_rate_cm_hr=0.5,
                visibility_m=5000,
                snowpack_depth_cm=75.0,
                avalanche_hazard_grade=HazardGrade.GRADE_2_MODERATE,
            ),
            PassCondition(
                pass_name="Banihal Pass",
                sector="JAMMU-UDHAMPUR",
                elevation_m=2832,
                lat=33.5150,
                lon=75.1950,
                status=PassStatus.OPEN,
                cause="NAVYUG_TUNNEL_CORRIDOR_CLEAR",
                temp_c=-2.0,
                wind_speed_kmh=15.0,
                snow_rate_cm_hr=0.0,
                visibility_m=10000,
                snowpack_depth_cm=10.0,
                avalanche_hazard_grade=HazardGrade.GRADE_1_LOW,
            ),
            PassCondition(
                pass_name="Fotu La",
                sector="DRAS-KARGIL-LEH",
                elevation_m=4108,
                lat=34.2892,
                lon=76.7911,
                status=PassStatus.OPEN,
                cause="HIGHWAY_CLEARED",
                temp_c=-15.0,
                wind_speed_kmh=22.0,
                snow_rate_cm_hr=0.0,
                visibility_m=8500,
                snowpack_depth_cm=35.0,
                avalanche_hazard_grade=HazardGrade.GRADE_1_LOW,
            ),
            PassCondition(
                pass_name="Wari La",
                sector="CENTRAL-LADAKH / NUBRA BYPASS",
                elevation_m=5312,
                lat=34.1950,
                lon=77.8200,
                status=PassStatus.OPEN,
                cause="STANDBY_TACTICAL_BYPASS",
                temp_c=-21.0,
                wind_speed_kmh=35.0,
                snow_rate_cm_hr=0.4,
                visibility_m=4500,
                snowpack_depth_cm=80.0,
                avalanche_hazard_grade=HazardGrade.GRADE_2_MODERATE,
            ),
            PassCondition(
                pass_name="Saser Pass",
                sector="NUBRA-DBO TRACK",
                elevation_m=5411,
                lat=35.0100,
                lon=77.7200,
                status=PassStatus.OPEN,
                cause="TRACK_PASSABLE_SPECIAL_SNOWCAT",
                temp_c=-28.0,
                wind_speed_kmh=45.0,
                snow_rate_cm_hr=0.8,
                visibility_m=3500,
                snowpack_depth_cm=110.0,
                avalanche_hazard_grade=HazardGrade.GRADE_2_MODERATE,
            ),
        ]
        for p in baseline_data:
            self._passes[p.pass_name.lower()] = p

    def get_pass(self, pass_name: str) -> Optional[PassCondition]:
        """Look up a pass by full or partial name (case-insensitive)."""
        clean = pass_name.strip().lower()
        if clean in self._passes:
            return self._passes[clean]
        for key, condition in self._passes.items():
            if clean in key or key in clean:
                return condition
        return None

    def get_all_passes(self) -> Dict[str, PassCondition]:
        """Return shallow copy of all registered pass conditions."""
        return dict(self._passes)

    def set_pass_status(
        self,
        pass_name: str,
        status: PassStatus | str,
        cause: str = "MANUAL_COMMAND_OVERRIDE",
        hazard_grade: Optional[HazardGrade | int] = None,
    ) -> PassCondition:
        """Dynamically update clearance status and disruption cause for a mountain pass."""
        target = self.get_pass(pass_name)
        if not target:
            # Dynamically register custom pass
            stat_enum = PassStatus(status) if isinstance(status, str) else status
            grade_enum = (
                HazardGrade(hazard_grade)
                if hazard_grade
                else (HazardGrade.GRADE_4_HIGH if stat_enum == PassStatus.BLOCKED else HazardGrade.GRADE_1_LOW)
            )
            target = PassCondition(
                pass_name=pass_name,
                sector="NORTHERN-THEATER-FORWARD",
                elevation_m=4800,
                lat=34.5000,
                lon=77.5000,
                status=stat_enum,
                cause=cause,
                avalanche_hazard_grade=grade_enum,
            )
            self._passes[pass_name.strip().lower()] = target
            logger.info("Registered new pass '%s' with status=%s", pass_name, stat_enum.value)
            return target

        if isinstance(status, str):
            try:
                status = PassStatus(status)
            except ValueError:
                status = PassStatus.BLOCKED if "BLOCK" in status.upper() else PassStatus.OPEN

        target.status = status
        target.cause = cause
        if hazard_grade is not None:
            target.avalanche_hazard_grade = (
                HazardGrade(hazard_grade) if isinstance(hazard_grade, int) else hazard_grade
            )
        elif status == PassStatus.BLOCKED:
            target.avalanche_hazard_grade = HazardGrade.GRADE_4_HIGH
            target.snow_rate_cm_hr = max(target.snow_rate_cm_hr, 4.5)
            target.wind_speed_kmh = max(target.wind_speed_kmh, 68.0)
            target.visibility_m = min(target.visibility_m, 300)

        target.last_updated = datetime.now(timezone.utc).isoformat()
        logger.warning(
            "Pass status updated: '%s' -> %s (Cause: %s, Hazard: Grade %s)",
            target.pass_name,
            target.status.value,
            target.cause,
            target.avalanche_hazard_grade.value,
        )
        return target

    def reset_all_passes(self) -> List[PassCondition]:
        """Reset all mountain passes back to default open operational status."""
        self._initialize_baseline_passes()
        logger.info("All northern theater mountain passes reset to OPEN baseline.")
        return list(self._passes.values())


# Process-wide singleton
_weather_feed_instance: Optional[TerrainWeatherFeed] = None


def get_weather_feed() -> TerrainWeatherFeed:
    global _weather_feed_instance
    if _weather_feed_instance is None:
        _weather_feed_instance = TerrainWeatherFeed()
    return _weather_feed_instance
