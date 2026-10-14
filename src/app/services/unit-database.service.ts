import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { 
  ArmyCommand, 
  ArmyUnit, 
  INDIAN_ARMY_COMMANDS, 
  ALL_INDIAN_ARMY_UNITS,
  getAllCommands,
  getAllUnits,
  getCommandById,
  getUnitsByCommand as queryUnitsByCommand,
  searchArmyUnits,
  getIndianArmyTelemetrySummary
} from '../data/indian-army-commands-database';

export type { ArmyCommand, ArmyUnit };

@Injectable({
  providedIn: 'root'
})
export class UnitDatabaseService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:8000/api/v1';

  /**
   * Comprehensive Indian Army Commands Database (All 7 Commands + ANC + Army HQ)
   */
  readonly allCommands: ArmyCommand[] = INDIAN_ARMY_COMMANDS;

  /**
   * Comprehensive Indian Army Units Database across all Commands of India
   * With authentic addresses, stations, military formations, officers, and scenic imagery.
   */
  readonly allUnits: ArmyUnit[] = ALL_INDIAN_ARMY_UNITS;

  /** Currently selected active unit signal */
  private _selectedUnit = signal<ArmyUnit>(this.allUnits[0]);
  readonly selectedUnit = computed(() => this._selectedUnit());

  /** Selected command filter signal */
  readonly selectedCommandFilter = signal<string>('All');

  /** Dynamic national telemetry summary signal backed by FastAPI */
  private _telemetrySummary = signal(getIndianArmyTelemetrySummary());

  constructor() {
    this.fetchTelemetryFromBackend();
  }

  /**
   * Fetches real-time status summary from FastAPI backend: GET /api/v1/inventory/status
   * Gracefully falls back to Indian Army static summary if backend is offline.
   */
  fetchTelemetryFromBackend(): void {
    this.http.get<any>(`${this.API_BASE}/inventory/status`).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data && data.summary) {
        this._telemetrySummary.update(curr => ({
          ...curr,
          criticalRiskUnits: data.summary.critical_shortages_count != null ? data.summary.critical_shortages_count : curr.criticalRiskUnits
        }));
      }
    });
  }

  /** Select active unit by ID */
  selectUnit(unitId: string): void {
    const found = this.allUnits.find(u => u.id === unitId);
    if (found) {
      this._selectedUnit.set(found);
    }
  }

  /** Select active unit by object */
  setSelectedUnit(unit: ArmyUnit): void {
    this._selectedUnit.set(unit);
  }

  /** Get unit by ID */
  getUnitById(id: string): ArmyUnit | undefined {
    return this.allUnits.find(u => u.id === id);
  }

  /** Filter units by command */
  getUnitsByCommand(command: string): ArmyUnit[] {
    if (!command || command === 'All') return this.allUnits;
    return queryUnitsByCommand(command);
  }

  /** Filter units by combat arm/service */
  getUnitsByType(type: string): ArmyUnit[] {
    if (!type || type === 'All') return this.allUnits;
    return this.allUnits.filter(u => u.type.toLowerCase() === type.toLowerCase());
  }

  /** Search units by keyword */
  searchUnits(query: string): ArmyUnit[] {
    return searchArmyUnits(query);
  }

  /** Get Command details by ID or code */
  getCommand(commandIdOrCode: string): ArmyCommand | undefined {
    return getCommandById(commandIdOrCode);
  }

  /** National summary telemetry */
  getTelemetrySummary() {
    return this._telemetrySummary();
  }
}
