"""
Unit and Integration Test Suite for Sena Aapurti War-Reserve & Combat Tempo Analytics Engine.
Covers:
  - Combat tempo non-linear multipliers and Monte Carlo surge model
  - Statutory War Wastage Reserve (WWR) echelon threshold evaluation
  - Pre-emptive replenishment breach anticipation
  - FastAPI forecast and stress-testing REST endpoints matching Angular schema
"""

import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.analytics_engine.combat_tempo_model import (
    CombatTempo,
    CombatTempoModel,
    TEMPO_MULTIPLIERS,
)
from app.analytics_engine.wwr_sentinel import (
    WWRSentinel,
    WWRRiskAssessment,
)
from app.analytics_engine.forecast_service import (
    ForecastService,
    get_forecast_service,
)


def test_combat_tempo_multipliers_doctrine():
    """Verify statutory tempo multipliers match defense operations research requirements."""
    # PEACETIME
    assert TEMPO_MULTIPLIERS[CombatTempo.PEACETIME]["CLASS_V"] == 1.0
    assert TEMPO_MULTIPLIERS[CombatTempo.PEACETIME]["CLASS_III"] == 1.0

    # HEIGHTENED_VIGIL
    assert TEMPO_MULTIPLIERS[CombatTempo.HEIGHTENED_VIGIL]["CLASS_V"] == 1.5
    assert TEMPO_MULTIPLIERS[CombatTempo.HEIGHTENED_VIGIL]["CLASS_III"] == 1.4

    # TACTICAL_CONFLICT
    assert TEMPO_MULTIPLIERS[CombatTempo.TACTICAL_CONFLICT]["CLASS_V"] == 5.8
    assert TEMPO_MULTIPLIERS[CombatTempo.TACTICAL_CONFLICT]["CLASS_III"] == 3.2
    assert TEMPO_MULTIPLIERS[CombatTempo.TACTICAL_CONFLICT]["CLASS_VIII"] == 4.0

    # FULL_SCALE_MOBILIZATION
    assert TEMPO_MULTIPLIERS[CombatTempo.FULL_SCALE_MOBILIZATION]["CLASS_V"] == 12.0
    assert TEMPO_MULTIPLIERS[CombatTempo.FULL_SCALE_MOBILIZATION]["CLASS_III"] == 5.0


def test_combat_tempo_monte_carlo_quantiles():
    """Verify Monte Carlo simulation bounds and monotonic stock progression."""
    model = CombatTempoModel(iterations=1000, seed=2026)
    res = model.simulate_depletion(
        current_stock=12500.0,
        baseline_daily_consumption=440.0,
        supply_class="CLASS_V",
        tempo=CombatTempo.PEACETIME,
        horizon_days=14,
    )

    assert len(res.projection_series) == 14
    for pt in res.projection_series:
        # Lower bound (P10 remaining stock) <= Median (P50) <= Upper bound (P90)
        assert pt.lower_bound <= pt.predicted_stock <= pt.upper_bound


def test_wwr_sentinel_peacetime_safety():
    """Verify peacetime operations remain safely above 35% WWR barrier."""
    service = get_forecast_service()
    forecast = service.generate_forecast(
        unit_id="DEPOT-KGL",
        sku="AMMO-7.62MM",
        tempo="PEACETIME",
        simulated_days=14,
    )

    assert forecast["unit_id"] == "DEPOT-KGL"
    assert forecast["sku"] == "AMMO-7.62MM"
    assert forecast["tempo"] == "PEACETIME"
    assert forecast["current_stock"] == 12500
    assert forecast["wwr_threshold"] == 4375  # 35% of 12,500
    assert forecast["days_of_supply"] >= 25.0
    assert forecast["wwr_breach_expected_in_days"] is None
    assert forecast["preemptive_alert"] is False


def test_wwr_sentinel_tactical_conflict_breach():
    """Verify combat surge triggers pre-emptive alert and calculates breach in ~2.8 days."""
    service = get_forecast_service()
    forecast = service.generate_forecast(
        unit_id="DEPOT-KGL",
        sku="AMMO-7.62MM",
        tempo="TACTICAL_CONFLICT",
        simulated_days=14,
    )

    assert forecast["tempo"] == "TACTICAL_CONFLICT"
    assert forecast["wwr_threshold"] == 4375

    # Days of supply collapses from 28.5 to ~5.0
    assert forecast["days_of_supply"] <= 6.0

    # Breach occurs within ~2.8 days
    assert forecast["wwr_breach_expected_in_days"] is not None
    assert 2.0 <= forecast["wwr_breach_expected_in_days"] <= 3.5

    # Pre-emptive alert must be ACTIVE
    assert forecast["preemptive_alert"] is True
    assert forecast["replenishment_recommended"] >= 10000


def test_forecast_contract_schema_compatibility():
    """Strictly verify keys and types conform to Angular forecast-view.component.ts contract."""
    service = get_forecast_service()
    forecast = service.generate_forecast(
        unit_id="DEPOT-KGL",
        sku="AMMO-7.62MM",
        tempo="TACTICAL_CONFLICT",
        simulated_days=7,
    )

    expected_keys = {
        "unit_id",
        "sku",
        "tempo",
        "current_stock",
        "wwr_threshold",
        "days_of_supply",
        "wwr_breach_expected_in_days",
        "replenishment_recommended",
        "preemptive_alert",
        "projection_series",
    }
    for k in expected_keys:
        assert k in forecast, f"Missing expected key: {k}"

    assert isinstance(forecast["projection_series"], list)
    assert len(forecast["projection_series"]) == 7

    for pt in forecast["projection_series"]:
        assert "day" in pt
        assert "predicted_stock" in pt
        assert "lower_bound" in pt
        assert "upper_bound" in pt


def test_fastapi_forecast_projections_endpoint():
    client = TestClient(app)
    resp = client.get(
        "/api/v1/forecast/projections",
        params={
            "unit_id": "DEPOT-KGL",
            "sku": "AMMO-7.62MM",
            "tempo": "PEACETIME",
            "simulated_days": 14,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["unit_id"] == "DEPOT-KGL"
    assert data["tempo"] == "PEACETIME"
    assert data["days_of_supply"] >= 25.0
    assert len(data["projection_series"]) == 14


def test_fastapi_stress_test_endpoint():
    client = TestClient(app)
    resp = client.post(
        "/api/v1/forecast/stress-test",
        json={
            "unit_id": "DEPOT-KGL",
            "sku": "AMMO-7.62MM",
            "tempo": "TACTICAL_CONFLICT",
            "simulated_days": 14,
            "current_stock": 12500,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["tempo"] == "TACTICAL_CONFLICT"
    assert data["preemptive_alert"] is True
    assert data["wwr_breach_expected_in_days"] is not None


def test_fastapi_tempos_skus_and_units_endpoints():
    client = TestClient(app)

    # Tempos
    t_resp = client.get("/api/v1/forecast/tempos")
    assert t_resp.status_code == 200
    tempos = t_resp.json()
    assert len(tempos) == 4

    # SKUs
    s_resp = client.get("/api/v1/forecast/skus")
    assert s_resp.status_code == 200
    skus = s_resp.json()
    assert len(skus) >= 6

    # Units
    u_resp = client.get("/api/v1/forecast/units")
    assert u_resp.status_code == 200
    units = u_resp.json()
    assert len(units) >= 6
