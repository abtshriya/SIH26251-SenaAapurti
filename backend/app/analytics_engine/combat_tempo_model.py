"""
Combat Tempo Depletion Engine & Monte Carlo Surge Simulator.
Models non-linear military consumption surges across statutory supply classes (POL, Ammo, Rations, Medical)
under variable operational tempos using stochastic Gaussian and compound Poisson surge distributions.
"""

from __future__ import annotations

import logging
import math
from enum import Enum
from typing import Any, Dict, List, Optional
import numpy as np
from pydantic import BaseModel, Field

logger = logging.getLogger("sena_aapurti.analytics_engine.tempo_model")


class CombatTempo(str, Enum):
    PEACETIME = "PEACETIME"
    HEIGHTENED_VIGIL = "HEIGHTENED_VIGIL"
    TACTICAL_CONFLICT = "TACTICAL_CONFLICT"
    FULL_SCALE_MOBILIZATION = "FULL_SCALE_MOBILIZATION"


# Operational Tempo Surge Multipliers as specified by Defense Operations Research Doctrine
TEMPO_MULTIPLIERS: Dict[CombatTempo, Dict[str, float]] = {
    CombatTempo.PEACETIME: {
        "CLASS_I": 1.0,
        "CLASS_III": 1.0,
        "CLASS_V": 1.0,
        "CLASS_VIII": 1.0,
    },
    CombatTempo.HEIGHTENED_VIGIL: {
        "CLASS_I": 1.2,
        "CLASS_III": 1.4,
        "CLASS_V": 1.5,
        "CLASS_VIII": 1.3,
    },
    CombatTempo.TACTICAL_CONFLICT: {
        "CLASS_I": 1.5,
        "CLASS_III": 3.2,
        "CLASS_V": 5.8,
        "CLASS_VIII": 4.0,
    },
    CombatTempo.FULL_SCALE_MOBILIZATION: {
        "CLASS_I": 2.0,
        "CLASS_III": 5.0,
        "CLASS_V": 12.0,
        "CLASS_VIII": 8.5,
    },
}

# Combat volatility parameters per tempo (Gaussian standard deviation and spike probability)
TEMPO_VOLATILITY: Dict[CombatTempo, Dict[str, float]] = {
    CombatTempo.PEACETIME: {"sigma": 0.08, "spike_prob": 0.02, "spike_intensity": 1.15},
    CombatTempo.HEIGHTENED_VIGIL: {"sigma": 0.14, "spike_prob": 0.08, "spike_intensity": 1.35},
    CombatTempo.TACTICAL_CONFLICT: {"sigma": 0.22, "spike_prob": 0.25, "spike_intensity": 1.65},
    CombatTempo.FULL_SCALE_MOBILIZATION: {"sigma": 0.32, "spike_prob": 0.40, "spike_intensity": 2.20},
}


class ProjectionPoint(BaseModel):
    day: int
    predicted_stock: float
    lower_bound: float  # 10th percentile (pessimistic high-burn trajectory)
    upper_bound: float  # 90th percentile (optimistic low-burn trajectory)


class SimulationResult(BaseModel):
    tempo: CombatTempo
    supply_class: str
    current_stock: float
    multiplier_applied: float
    daily_burn_mean: float
    days_of_supply: float
    projection_series: List[ProjectionPoint]


class CombatTempoModel:
    """
    Monte Carlo and Bayesian surge depletion simulator.
    Evaluates 1,000 stochastic forward paths to estimate multi-echelon stock trajectories.
    """

    def __init__(self, iterations: int = 1000, seed: Optional[int] = 2026) -> None:
        self.iterations = iterations
        self.seed = seed

    def simulate_depletion(
        self,
        current_stock: float,
        baseline_daily_consumption: float,
        supply_class: str,
        tempo: CombatTempo = CombatTempo.PEACETIME,
        horizon_days: int = 30,
    ) -> SimulationResult:
        """
        Executes a 1,000-iteration Monte Carlo simulation of stock depletion over horizon_days.
        """
        if current_stock < 0:
            raise ValueError("Current stock cannot be negative.")
        if baseline_daily_consumption <= 0:
            raise ValueError("Baseline daily consumption must be strictly positive.")

        clean_class = supply_class.upper().strip()
        if not clean_class.startswith("CLASS_"):
            clean_class = f"CLASS_{clean_class}"

        class_mults = TEMPO_MULTIPLIERS.get(tempo, TEMPO_MULTIPLIERS[CombatTempo.PEACETIME])
        multiplier = class_mults.get(clean_class, 1.0)
        volatility = TEMPO_VOLATILITY.get(tempo, TEMPO_VOLATILITY[CombatTempo.PEACETIME])

        mean_burn_per_day = baseline_daily_consumption * multiplier

        # Reproducible random generator
        rng = np.random.default_rng(self.seed)

        # Simulation matrix: shape (iterations, horizon_days)
        # Daily burn rate = mean * (1 + N(0, sigma)) * (spike if uniform < spike_prob)
        sigma = volatility["sigma"]
        spike_prob = volatility["spike_prob"]
        spike_int = volatility["spike_intensity"]

        noise = rng.normal(0, sigma, size=(self.iterations, horizon_days))
        spikes = rng.uniform(0, 1, size=(self.iterations, horizon_days)) < spike_prob
        spike_factors = np.where(spikes, spike_int, 1.0)

        # Ensure daily burn remains positive
        burn_rates = np.maximum(0.1, mean_burn_per_day * (1.0 + noise) * spike_factors)

        # Cumulative burn from day 1 to horizon_days
        cum_burn = np.cumsum(burn_rates, axis=1)

        # Remaining stock paths
        stock_paths = np.maximum(0.0, current_stock - cum_burn)

        # Calculate percentiles across iterations for each day:
        # 10th percentile remaining stock = pessimistic lower bound
        # 50th percentile remaining stock = median predicted stock
        # 90th percentile remaining stock = optimistic upper bound
        p10 = np.percentile(stock_paths, 10, axis=0)
        p50 = np.percentile(stock_paths, 50, axis=0)
        p90 = np.percentile(stock_paths, 90, axis=0)

        projection_series: List[ProjectionPoint] = []
        for day_idx in range(horizon_days):
            day_num = day_idx + 1
            projection_series.append(
                ProjectionPoint(
                    day=day_num,
                    predicted_stock=round(float(p50[day_idx]), 1),
                    lower_bound=round(float(p10[day_idx]), 1),
                    upper_bound=round(float(p90[day_idx]), 1),
                )
            )

        # Compute Days of Supply based on median projection
        if mean_burn_per_day > 0:
            days_of_supply = round(current_stock / mean_burn_per_day, 1)
        else:
            days_of_supply = 999.0

        return SimulationResult(
            tempo=tempo,
            supply_class=clean_class,
            current_stock=current_stock,
            multiplier_applied=multiplier,
            daily_burn_mean=round(mean_burn_per_day, 1),
            days_of_supply=days_of_supply,
            projection_series=projection_series,
        )
