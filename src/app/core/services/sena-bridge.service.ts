import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { LogisticsService } from '../../services/logistics.service';

export interface BlockageResponse {
  type: string;
  features: any[];
  simulation_receipt?: {
    target_pass: string;
    status: string;
    cause: string;
    hazard_grade: number;
    updated_at: string;
  };
  rotary_manifest?: {
    required_sorties: number;
    aircraft_type: string;
    recommended_fleet: string;
    total_cargo_kg: number;
    corridor_waypoints: any[];
  };
  total_distance_km?: number;
  route_type?: string;
  [key: string]: any;
}

export interface StressTestResponse {
  unit_id: string;
  sku: string;
  tempo: string;
  days_of_supply: number;
  wwr_breach_detected: boolean;
  days_to_breach: number;
  replenishment_recommended_qty: number;
  projections?: any[];
  [key: string]: any;
}

export interface HandoverVerifyResponse {
  status: string;
  cid: string;
  sku: string;
  qty_received: number;
  updated_stock: number;
  terminal_id?: string;
  verified_at?: string;
  ledger_receipt?: {
    log_id: number;
    previous_hash: string;
    current_hash: string;
    timestamp: string;
  };
  [key: string]: any;
}

export interface ThreatSummaryResponse {
  total_threats_blocked: number;
  quarantined_devices: string[];
  active_alerts: Array<{
    incident_id: string;
    attack_type: string;
    device_id: string;
    timestamp: string;
    severity: string;
    action_taken: string;
    details?: string;
  }>;
  radar_status?: string;
  defense_posture?: string;
  [key: string]: any;
}

export interface MeshSyncResponse {
  status: string;
  batch_id: string;
  node_id: string;
  total_received: number;
  committed: number;
  duplicates_ignored: number;
  sequence_gaps_detected?: number[];
  new_stock_state?: Record<string, number>;
  inventory_deficit_flag?: boolean;
  audit_hashes_generated: number;
  node_health: string;
  message: string;
  [key: string]: any;
}

export interface ColdChainLogResponse {
  container_id: string;
  consignment_id: string;
  sku: string;
  current_temp: number;
  ambient_temp: number;
  heater_active: boolean;
  battery_pct: number;
  g_force: number;
  viability_score: number;
  condition_status: 'USABLE' | 'NEEDS_INSPECTION' | 'COMPROMISED_QUARANTINE';
  quarantine_triggered: boolean;
  breach_type?: string;
  quarantine_event?: {
    event_id: string;
    quarantined_quantity: number;
    replacement_indent_id: string;
    replacement_status: string;
    usable_stock_remaining: number;
    total_quarantined_stock: number;
    proof_hash?: string;
  };
  action_summary: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class SenaBridgeService {
  private http = inject(HttpClient);
  private logisticsService = inject(LogisticsService);
  private readonly baseUrl = 'http://localhost:8000/api/v1';

  /**
   * Broadcasts a global CustomEvent on `window` with type-safe detail payload
   * allowing any dashboard, map view, or telemetry feed to seamlessly sync.
   */
  broadcast(eventType: 'sena:route-updated' | 'sena:requisitions-updated' | 'sena:inventory-updated' | 'sena:threat-detected', detail: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, { detail }));
    }
  }

  // ---------------------------------------------------------------------------
  // 1. "Silent Pass" Multimodal Air-Drop Router (GIS)
  // ---------------------------------------------------------------------------
  simulatePassBlockage(passName: string = 'Khardung La'): Observable<BlockageResponse> {
    const payload = {
      pass_name: passName,
      status: 'BLOCKED',
      cause: 'AVALANCHE_WARNING_RED',
      hazard_grade: 5,
      origin_id: 'NODE-DEPOT-LEH',
      destination_id: 'NODE-FOB-DBO',
      cargo_weight_kg: 13000.0
    };

    return this.http.post<BlockageResponse>(`${this.baseUrl}/gis/simulate-blockage`, payload).pipe(
      tap((res) => {
        // Broadcast GeoJSON update for dynamic Leaflet corridor painting
        this.broadcast('sena:route-updated', res);

        // Also add strategic alert to logistics service for instant dashboard reflection
        const receipt = res.simulation_receipt;
        const sorties = res.rotary_manifest?.required_sorties || 3;
        const acType = res.rotary_manifest?.aircraft_type || 'Mi-17V5';
        this.logisticsService.alerts.update(alerts => [
          {
            id: `ALT-PASS-${Date.now().toString().slice(-4)}`,
            theater: 'Northern Command',
            sector: 'Ladakh - Siachen Axis',
            type: 'Route Disruption',
            severity: 'Critical',
            headline: `AVALANCHE ALERT: ${passName} Blocked - Air Corridor Activated`,
            details: `Khardung La closed due to RED avalanche warning. Diverted to rotary corridor: ${sorties}x ${acType} sorties allocated for Daulat Beg Oldie air-drop.`,
            affectedUnit: 'Forward Base DBO (14 Corps)',
            affectedSupply: 'High-Altitude Winter Stores (13,000 kg)',
            recommendedAction: `Execute Multimodal Heli-Drop Sorties via Staging Helipad`,
            timestamp: 'Just now'
          },
          ...alerts
        ]);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 2. War Reserve Sentinel & Combat Tempo Depletion Engine (Forecast)
  // ---------------------------------------------------------------------------
  triggerTempoShift(tempo: string = 'TACTICAL_CONFLICT'): Observable<StressTestResponse> {
    const payload = {
      unit_id: 'DEPOT-KGL',
      sku: 'AMMO-7.62MM',
      tempo: tempo,
      simulated_days: 14
    };

    return this.http.post<StressTestResponse>(`${this.baseUrl}/forecast/stress-test`, payload).pipe(
      tap((res) => {
        this.broadcast('sena:inventory-updated', res);

        // Notify dashboard of strategic surge
        this.logisticsService.alerts.update(alerts => [
          {
            id: `ALT-TEMPO-${Date.now().toString().slice(-4)}`,
            theater: 'Northern Command',
            sector: 'Kargil - Drass Sector',
            type: 'Demand Surge',
            severity: res.wwr_breach_detected ? 'Critical' : 'High',
            headline: `TEMPO SHIFT: ${tempo} Activated for Kargil Depot`,
            details: `Combat burn rate accelerated. Projected Days of Supply (DOS): ${res.days_of_supply} days. WWR breach projected on day ${res.days_to_breach || 4}. Pre-emptive replenishment: +${res.replenishment_recommended_qty.toLocaleString()} units required.`,
            affectedUnit: 'Forward Logistics Depot Kargil',
            affectedSupply: '7.62mm NATO Ball Ammunition',
            recommendedAction: 'Trigger Autonomous Echelon Surge Replenishment Indent',
            timestamp: 'Just now'
          },
          ...alerts
        ]);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Cryptographic Blind Drop & Offline QR Handover
  // ---------------------------------------------------------------------------
  verifyOfflineDrop(token?: string): Observable<HandoverVerifyResponse> {
    if (token) {
      return this.executeScanVerify(token);
    }

    // First generate an authentic cryptographically signed manifest from HQ backend
    const manifestReq = {
      origin_unit: 'HQ-NORTH',
      destination_unit: 'DEPOT-KGL',
      sku: 'MUN-762-NATO',
      quantity: 5000,
      unit_id: 'UNIT-FOB-BRAVO',
      ttl_hours: 24.0
    };

    return new Observable<HandoverVerifyResponse>((observer) => {
      this.http.post<any>(`${this.baseUrl}/handover/generate-manifest`, manifestReq).subscribe({
        next: (manifestRes) => {
          const compactToken = manifestRes.compact_token;
          this.executeScanVerify(compactToken).subscribe({
            next: (res) => {
              observer.next(res);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => {
          // Fallback to sample token if generate fails
          this.executeScanVerify(this.generateSampleToken()).subscribe({
            next: (res) => {
              observer.next(res);
              observer.complete();
            },
            error: (scanErr) => observer.error(scanErr)
          });
        }
      });
    });
  }

  private executeScanVerify(token: string): Observable<HandoverVerifyResponse> {
    const payload = {
      token: token,
      terminal_id: 'TERM-KGL-001',
      expected_dest: 'DEPOT-KGL'
    };

    return this.http.post<HandoverVerifyResponse>(`${this.baseUrl}/handover/scan-verify`, payload).pipe(
      tap((res) => {
        this.broadcast('sena:requisitions-updated', res);
        this.broadcast('sena:inventory-updated', res);

        // Update inventory in memory
        this.logisticsService.inventoryCatalog.update(items =>
          items.map(item => {
            if (item.id === 'INV-MUN-03' || item.item.includes('7.62mm')) {
              return {
                ...item,
                totalQuantity: `${(parseInt(item.totalQuantity.replace(/,/g, '')) + res.qty_received).toLocaleString()} Rounds`,
                status: 'Adequate'
              };
            }
            return item;
          })
        );
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Sensor Spoofing & Tamper-Evident SOC Radar
  // ---------------------------------------------------------------------------
  simulateAdversaryAttack(): Observable<any> {
    // Intentionally tampered packet: altered delta_qty with invalid HMAC signature to trigger SOC interception
    const spoofedPacket = {
      device_id: 'RFID-LOC-KGL-01',
      timestamp: Math.floor(Date.now() / 1000),
      nonce: `spoof-nonce-${Math.random().toString(36).substring(2, 10)}`,
      unit_id: 'DEPOT-KGL',
      sku: 'AMMO-7.62MM',
      delta_qty: -2000, // Phantom depletion injection
      latitude: 34.5539,
      longitude: 76.1320,
      signature: '0000000000000000000000000000000000000000000000000000000000000000_TAMPERED'
    };

    return this.http.post(`${this.baseUrl}/telemetry/ingest-secure`, spoofedPacket).pipe(
      catchError((err) => {
        const errorDetail = err.error?.detail || err.error || { attack_type: 'MITM_SIGNATURE_TAMPERING' };
        this.broadcast('sena:threat-detected', errorDetail);

        // Push immediate Critical SOC alert to command dashboard
        this.logisticsService.alerts.update(alerts => [
          {
            id: `ALT-SOC-${Date.now().toString().slice(-4)}`,
            theater: 'Northern Command',
            sector: 'Kargil Forward Sector',
            type: 'Convoy Bottleneck',
            severity: 'Critical',
            headline: 'SOC THREAT ALERT: RFID Sensor Tampering Intercepted',
            details: `Cryptographic HMAC mismatch detected on device RFID-LOC-KGL-01. Adversary attempted phantom depletion (-2,000 crates). Zero Database Drift maintained. Device placed in 30-min quarantine.`,
            affectedUnit: 'DEPOT-KGL (Forward Base Kargil)',
            affectedSupply: 'Class V (Munitions)',
            recommendedAction: 'Engage Physical Guard Patrol & Inspect Transponder Unit',
            timestamp: 'Just now'
          },
          ...alerts
        ]);

        return of({ intercepted: true, status: err.status, detail: errorDetail });
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Tactical Mesh 72h Blackout Reconciler
  // ---------------------------------------------------------------------------
  reconcileBlackoutBatch(): Observable<MeshSyncResponse> {
    const now = Math.floor(Date.now() / 1000);
    const batchPayload = {
      node_id: 'DEPOT-KGL',
      batch_id: `BATCH-KGL-RECON-${Date.now().toString().slice(-6)}`,
      events: [
        {
          transaction_uuid: `tx-${Math.random().toString(36).substring(2, 12)}`,
          origin_node_id: 'DEPOT-KGL',
          seq_no: 101,
          client_timestamp: now - 216000, // 60h ago
          sku: 'DIESEL-WINTER-GRADE',
          delta_qty: -250,
          operator_id: 'SUBEDAR_LOG_OFFICER',
          proof_hash: '48dbc12a03c2f7a3dabb11029482910481920491028491029384910293849102'
        },
        {
          transaction_uuid: `tx-${Math.random().toString(36).substring(2, 12)}`,
          origin_node_id: 'DEPOT-KGL',
          seq_no: 102,
          client_timestamp: now - 172800, // 48h ago
          sku: 'DIESEL-WINTER-GRADE',
          delta_qty: -150,
          operator_id: 'SUBEDAR_LOG_OFFICER',
          proof_hash: '5cc193001aa40b8ec08728109284019284019284019284019284019284019284'
        },
        {
          transaction_uuid: `tx-${Math.random().toString(36).substring(2, 12)}`,
          origin_node_id: 'DEPOT-KGL',
          seq_no: 103,
          client_timestamp: now - 115200, // 32h ago
          sku: 'DIESEL-WINTER-GRADE',
          delta_qty: -300,
          operator_id: 'SUBEDAR_LOG_OFFICER',
          proof_hash: '4b540cedf6ddd91586c429184019284019284019284019284019284019284019'
        },
        {
          transaction_uuid: `tx-${Math.random().toString(36).substring(2, 12)}`,
          origin_node_id: 'DEPOT-KGL',
          seq_no: 104,
          client_timestamp: now - 57600, // 16h ago
          sku: 'DIESEL-WINTER-GRADE',
          delta_qty: -200,
          operator_id: 'SUBEDAR_LOG_OFFICER',
          proof_hash: 'd2047fe77071282b701f29184019284019284019284019284019284019284019'
        },
        {
          transaction_uuid: `tx-${Math.random().toString(36).substring(2, 12)}`,
          origin_node_id: 'DEPOT-KGL',
          seq_no: 105,
          client_timestamp: now - 14400, // 4h ago
          sku: 'DIESEL-WINTER-GRADE',
          delta_qty: -300,
          operator_id: 'SUBEDAR_LOG_OFFICER',
          proof_hash: '204ba2e16e2873683a4a29184019284019284019284019284019284019284019'
        }
      ]
    };

    return this.http.post<MeshSyncResponse>(`${this.baseUrl}/resilience/sync-batch`, batchPayload).pipe(
      tap((res) => {
        this.broadcast('sena:inventory-updated', res);

        // Update fuel item in catalog
        this.logisticsService.inventoryCatalog.update(items =>
          items.map(item => {
            if (item.id === 'INV-POL-01' || item.item.includes('Diesel')) {
              return {
                ...item,
                available: '1,028,800 Litres',
                status: 'Adequate'
              };
            }
            return item;
          })
        );
      })
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Cold-Chain Medical Freeze/Kinetic Shock Degradation Engine
  // ---------------------------------------------------------------------------
  simulateThermalBreach(): Observable<ColdChainLogResponse> {
    const breachTelemetry: any = {
      container_id: 'CONT-CHOPPER-MED-04',
      consignment_id: `REQ-MED-SIACHEN-${Date.now().toString().slice(-4)}`,
      sku: 'MED-HAPE-AMP',
      current_temp: -8.5, // Severe sub-zero freeze shock (< 0°C breach)
      target_min_temp: 2.0,
      target_max_temp: 8.0,
      ambient_temp: -28.0,
      g_force: 3.2,
      heater_active: false, // Convoy Peltier heater breakdown
      battery_pct: 28.0,
      door_open: false,
      quantity: 250,
      destination_node: 'UNIT-FOB-ALPHA',
      timestamp: Math.floor(Date.now() / 1000)
    };

    return this.http.post<ColdChainLogResponse>(`${this.baseUrl}/cold-chain/telemetry-log`, breachTelemetry).pipe(
      tap((res) => {
        this.broadcast('sena:inventory-updated', res);

        if (res.quarantine_triggered || res.condition_status === 'COMPROMISED_QUARANTINE') {
          // Push emergency replacement alert
          const indentId = res.quarantine_event?.replacement_indent_id || 'IND-MED-EMERGENCY-01';
          this.logisticsService.alerts.update(alerts => [
            {
              id: `ALT-MED-${Date.now().toString().slice(-4)}`,
              theater: 'Northern Command',
              sector: 'Siachen - Saltoro Ridge',
              type: 'Stock Critical',
              severity: 'Critical',
              headline: 'COLD-CHAIN FAILURE: 250 HAPE Ampoules Quarantined',
              details: `Container CONT-CHOPPER-MED-04 breached at -8.5°C (Viability: ${res.viability_score}%). Denatured ampoules locked in quarantine. Autonomous Emergency Sortie ${indentId} dispatched from Leh Air Base.`,
              affectedUnit: 'Forward Base Siachen-Alpha',
              affectedSupply: 'High-Altitude Pulmonary Edema Ampoules',
              recommendedAction: 'Prepare Helipad DZ for Emergency ALH Dhruv Air-Drop',
              timestamp: 'Just now'
            },
            ...alerts
          ]);
        }
      })
    );
  }

  // ---------------------------------------------------------------------------
  // SOC Threat Summary
  // ---------------------------------------------------------------------------
  getThreatSummary(): Observable<ThreatSummaryResponse> {
    return this.http.get<ThreatSummaryResponse>(`${this.baseUrl}/soc/threat-summary`);
  }

  // ---------------------------------------------------------------------------
  // Helper: Client-Side Sample Token Constructor (for instant demo handover)
  // ---------------------------------------------------------------------------
  private generateSampleToken(): string {
    const raw = {
      cid: `DROP-2026-NORTH-${Math.floor(1000 + Math.random() * 9000)}`,
      origin: 'HQ-NORTH',
      dest: 'DEPOT-KGL',
      sku: 'MUN-762-NATO',
      qty: 5000,
      unit_id: 'UNIT-FOB-BRAVO',
      issued_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      nonce: `sample-${Math.random().toString(36).substring(2, 12)}`,
      sig: 'demo-sample-sig'
    };
    return btoa(JSON.stringify(raw)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
