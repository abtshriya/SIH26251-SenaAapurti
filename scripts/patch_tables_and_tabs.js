const fs = require('fs');
const filePath = 'src/app/pages/command-dashboard/command-dashboard.component.html';
let content = fs.readFileSync(filePath, 'utf8');

function replaceNorm(target, replacement) {
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normReplacement = replacement.replace(/\r\n/g, '\n');
  if (normContent.includes(normTarget)) {
    const updated = normContent.replace(normTarget, normReplacement);
    content = content.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated;
    return true;
  }
  return false;
}

// 1. Units table
const tUnitsOld = `                <td class="font-mono text-gold font-bold">{{ u.id }}</td>
                <td>
                  <strong>{{ u.name }}</strong>
                  <div class="text-xs text-muted">{{ u.type }} • Cmdr: {{ u.commander }}</div>
                </td>
                <td>{{ u.location }}</td>
                <td>{{ u.personnel }}</td>
                <td>
                  <span class="badge-readiness" [class.bg-green]="u.readiness >= 96" [class.bg-amber]="u.readiness < 96">
                    {{ u.readiness }}%
                  </span>
                </td>
                <td>
                  <span class="badge-health" [class.text-green]="u.inventoryHealth === 'Healthy'" [class.text-amber]="u.inventoryHealth === 'Warning'">
                    ● {{ u.inventoryHealth }} ({{ u.dos }} DOS)
                  </span>
                </td>
                <td>
                  <span class="badge-risk" [class.badge-critical]="u.riskLevel === 'Critical'" [class.badge-high]="u.riskLevel === 'High'" [class.badge-gold]="u.riskLevel === 'Moderate'" [class.badge-success]="u.riskLevel === 'Low'">
                    {{ u.riskLevel }}
                  </span>
                </td>
                <td>{{ u.pendingRequests }} req</td>
                <td>
                  <span class="status-pill" [class.online]="u.onlineStatus === 'Online'" [class.satcom]="u.onlineStatus === 'SATCOM Only'">
                    {{ u.onlineStatus }}
                  </span>
                </td>`;

const tUnitsNew = `                <td class="font-mono text-gold font-bold">{{ u.id }}</td>
                <td>
                  <strong>{{ langService.t(u.name) }}</strong>
                  <div class="text-xs text-muted">{{ langService.t(u.type) }} • Cmdr: {{ u.commander }}</div>
                </td>
                <td>{{ langService.t(u.location) }}</td>
                <td>{{ u.personnel }}</td>
                <td>
                  <span class="badge-readiness" [class.bg-green]="u.readiness >= 96" [class.bg-amber]="u.readiness < 96">
                    {{ u.readiness }}%
                  </span>
                </td>
                <td>
                  <span class="badge-health" [class.text-green]="u.inventoryHealth === 'Healthy'" [class.text-amber]="u.inventoryHealth === 'Warning'">
                    ● {{ langService.t(u.inventoryHealth) }} ({{ u.dos }} DOS)
                  </span>
                </td>
                <td>
                  <span class="badge-risk" [class.badge-critical]="u.riskLevel === 'Critical'" [class.badge-high]="u.riskLevel === 'High'" [class.badge-gold]="u.riskLevel === 'Moderate'" [class.badge-success]="u.riskLevel === 'Low'">
                    {{ langService.t(u.riskLevel) }}
                  </span>
                </td>
                <td>{{ u.pendingRequests }} req</td>
                <td>
                  <span class="status-pill" [class.online]="u.onlineStatus === 'Online'" [class.satcom]="u.onlineStatus === 'SATCOM Only'">
                    {{ langService.t(u.onlineStatus) }}
                  </span>
                </td>`;

// 2. Inventory table
const tInvOld = `                <td class="font-mono text-gold font-bold">{{ item.id }}</td>
                <td>
                  <strong>{{ item.item }}</strong>
                  <div class="text-xs text-muted">{{ item.location }}</div>
                </td>
                <td><span class="badge-military">{{ item.category }}</span></td>
                <td>{{ item.totalQuantity }}</td>
                <td>{{ item.allocated }}</td>
                <td class="font-bold text-green">{{ item.available }}</td>
                <td>{{ item.daysOfSupply }} DOS</td>
                <td>
                  <span class="badge-risk" [class.badge-critical]="item.stockoutRisk === 'Critical'" [class.badge-high]="item.stockoutRisk === 'High'" [class.badge-gold]="item.stockoutRisk === 'Moderate'" [class.badge-success]="item.stockoutRisk === 'Low'">
                    {{ item.stockoutRisk }}
                  </span>
                </td>
                <td>
                  <span class="badge-health" [class.text-green]="item.status === 'Adequate'" [class.text-amber]="item.status === 'Depleted'">
                    {{ item.status }}
                  </span>
                </td>`;

const tInvNew = `                <td class="font-mono text-gold font-bold">{{ item.id }}</td>
                <td>
                  <strong>{{ langService.t(item.item) }}</strong>
                  <div class="text-xs text-muted">{{ langService.t(item.location) }}</div>
                </td>
                <td><span class="badge-military">{{ langService.t(item.category) }}</span></td>
                <td>{{ item.totalQuantity }}</td>
                <td>{{ item.allocated }}</td>
                <td class="font-bold text-green">{{ item.available }}</td>
                <td>{{ item.daysOfSupply }} DOS</td>
                <td>
                  <span class="badge-risk" [class.badge-critical]="item.stockoutRisk === 'Critical'" [class.badge-high]="item.stockoutRisk === 'High'" [class.badge-gold]="item.stockoutRisk === 'Moderate'" [class.badge-success]="item.stockoutRisk === 'Low'">
                    {{ langService.t(item.stockoutRisk) }}
                  </span>
                </td>
                <td>
                  <span class="badge-health" [class.text-green]="item.status === 'Adequate'" [class.text-amber]="item.status === 'Depleted'">
                    {{ langService.t(item.status) }}
                  </span>
                </td>`;

// 3. Convoys table
const tConvOld = `                <td class="font-mono text-gold font-bold text-nowrap">{{ c.id }}</td>
                <td class="text-nowrap"><strong>{{ c.callsign }}</strong></td>
                <td>{{ c.source }}</td>
                <td>{{ c.destination }}</td>
                <td class="text-nowrap"><span class="badge-military">{{ c.cargoType }}</span></td>
                <td class="text-nowrap">{{ c.vehiclesCount }} Trucks</td>
                <td class="text-nowrap">{{ c.tonnage }} T</td>
                <td class="text-nowrap">{{ c.departureTime }}</td>
                <td class="text-green font-bold text-nowrap">
                  <span class="live-clock-pulse"></span>
                  {{ getLiveEta(c) }}
                </td>
                <td class="text-nowrap">
                  <span class="badge-status" [class.badge-success]="c.status === 'In-Transit'" [class.badge-danger]="c.status === 'Delayed'" [class.badge-gold]="c.status === 'Rerouted'">
                    {{ c.status }}
                  </span>
                </td>`;

const tConvNew = `                <td class="font-mono text-gold font-bold text-nowrap">{{ c.id }}</td>
                <td class="text-nowrap"><strong>{{ c.callsign }}</strong></td>
                <td>{{ langService.t(c.source) }}</td>
                <td>{{ langService.t(c.destination) }}</td>
                <td class="text-nowrap"><span class="badge-military">{{ langService.t(c.cargoType) }}</span></td>
                <td class="text-nowrap">{{ c.vehiclesCount }} {{ langService.t('Trucks') }}</td>
                <td class="text-nowrap">{{ c.tonnage }} T</td>
                <td class="text-nowrap">{{ langService.t(c.departureTime) }}</td>
                <td class="text-green font-bold text-nowrap">
                  <span class="live-clock-pulse"></span>
                  {{ langService.translateText(getLiveEta(c)) }}
                </td>
                <td class="text-nowrap">
                  <span class="badge-status" [class.badge-success]="c.status === 'In-Transit'" [class.badge-danger]="c.status === 'Delayed'" [class.badge-gold]="c.status === 'Rerouted'">
                    {{ langService.t(c.status) }}
                  </span>
                </td>`;

// 4. Weather stations
const tWeatherOld = `<div class="st-head">
              <h4>{{ st.passName }}</h4>
              <span class="badge-risk" [class.badge-danger]="st.riskScore > 70" [class.badge-gold]="st.riskScore <= 70 && st.riskScore > 35" [class.badge-success]="st.riskScore <= 35">
                {{ langService.t('Risk Score:') }} {{ st.riskScore }}/100
              </span>
            </div>
            <span class="st-elev text-xs text-muted">{{ st.location }} • Elevation: {{ st.elevation }}</span>

            <div class="st-metrics mt-2">
              <div class="st-m"><span>{{ langService.t('Temp:') }}</span><strong>{{ st.temperature }}</strong></div>
              <div class="st-m"><span>{{ langService.t('Snow/Rain:') }}</span><strong>{{ st.rainfallSnow }}</strong></div>
              <div class="st-m"><span>{{ langService.t('Wind:') }}</span><strong>{{ st.windSpeed }}</strong></div>
              <div class="st-m"><span>{{ langService.t('Visibility:') }}</span><strong>{{ st.visibility }}</strong></div>
            </div>`;

const tWeatherNew = `<div class="st-head">
              <h4>{{ langService.t(st.passName) }}</h4>
              <span class="badge-risk" [class.badge-danger]="st.riskScore > 70" [class.badge-gold]="st.riskScore <= 70 && st.riskScore > 35" [class.badge-success]="st.riskScore <= 35">
                {{ langService.t('Risk Score:') }} {{ st.riskScore }}/100
              </span>
            </div>
            <span class="st-elev text-xs text-muted">{{ langService.t(st.location) }} • {{ langService.t('Elevation:') }} {{ st.elevation }}</span>

            <div class="st-metrics mt-2">
              <div class="st-m"><span>{{ langService.t('Temp:') }}</span><strong>{{ st.temperature }}</strong></div>
              <div class="st-m"><span>{{ langService.t('Snow/Rain:') }}</span><strong>{{ langService.t(st.rainfallSnow) }}</strong></div>
              <div class="st-m"><span>{{ langService.t('Wind:') }}</span><strong>{{ langService.t(st.windSpeed) }}</strong></div>
              <div class="st-m"><span>{{ langService.t('Visibility:') }}</span><strong>{{ langService.t(st.visibility) }}</strong></div>
            </div>`;

// 5. Toast msg
const tToastOld = `<div class="toast-msg">{{ alertActionSuccess }}</div>`;
const tToastNew = `<div class="toast-msg">{{ langService.translateText(alertActionSuccess) }}</div>`;

// 6. Simulation results
const tSimOld = `<span
                    class="s-risk-pill"
                    [class.risk-high]="logisticsService.simulationState().stockoutRisk.includes('Critical') || logisticsService.simulationState().stockoutRisk.includes('High')"
                    [class.risk-moderate]="logisticsService.simulationState().stockoutRisk.includes('Moderate') || logisticsService.simulationState().stockoutRisk.includes('Medium')"
                    [class.risk-low]="logisticsService.simulationState().stockoutRisk.includes('Low')"
                  >
                    <span class="pulse-beacon-dot"></span>
                    {{ logisticsService.simulationState().stockoutRisk }}
                  </span>`;

const tSimNew = `<span
                    class="s-risk-pill"
                    [class.risk-high]="logisticsService.simulationState().stockoutRisk.includes('Critical') || logisticsService.simulationState().stockoutRisk.includes('High')"
                    [class.risk-moderate]="logisticsService.simulationState().stockoutRisk.includes('Moderate') || logisticsService.simulationState().stockoutRisk.includes('Medium')"
                    [class.risk-low]="logisticsService.simulationState().stockoutRisk.includes('Low')"
                  >
                    <span class="pulse-beacon-dot"></span>
                    {{ langService.t(logisticsService.simulationState().stockoutRisk) }}
                  </span>`;

const tSimRemedyOld = `<p class="remedy-directive-text mt-2">
                {{ logisticsService.simulationState().remedyRecommendation }}
              </p>

              <div class="remedy-buffer-strip mt-2">
                <span class="buf-lbl">{{ langService.t('REQUIRED BUFFER:') }}</span>
                <strong class="buf-val">{{ logisticsService.simulationState().requiredBuffer }}</strong>
              </div>`;

const tSimRemedyNew = `<p class="remedy-directive-text mt-2">
                {{ langService.t(logisticsService.simulationState().remedyRecommendation) }}
              </p>

              <div class="remedy-buffer-strip mt-2">
                <span class="buf-lbl">{{ langService.t('REQUIRED BUFFER:') }}</span>
                <strong class="buf-val">{{ langService.t(logisticsService.simulationState().requiredBuffer) }}</strong>
              </div>`;

const tSimDeficitOld = `class="comp-caption"
                  [class.text-amber]="logisticsService.simulationState().stressPostureScore >= 60"
                  [class.text-red]="logisticsService.simulationState().stressPostureScore < 60"
                >{{ logisticsService.simulationState().resilienceDeficitText }}</span>`;

const tSimDeficitNew = `class="comp-caption"
                  [class.text-amber]="logisticsService.simulationState().stressPostureScore >= 60"
                  [class.text-red]="logisticsService.simulationState().stressPostureScore < 60"
                >{{ langService.t(logisticsService.simulationState().resilienceDeficitText) }}</span>`;

console.log('Patch units table:', replaceNorm(tUnitsOld, tUnitsNew));
console.log('Patch inv table:', replaceNorm(tInvOld, tInvNew));
console.log('Patch conv table:', replaceNorm(tConvOld, tConvNew));
console.log('Patch weather cards:', replaceNorm(tWeatherOld, tWeatherNew));
console.log('Patch toast message:', replaceNorm(tToastOld, tToastNew));
console.log('Patch sim risk:', replaceNorm(tSimOld, tSimNew));
console.log('Patch sim remedy:', replaceNorm(tSimRemedyOld, tSimRemedyNew));
console.log('Patch sim deficit:', replaceNorm(tSimDeficitOld, tSimDeficitNew));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching tables and tabs in command-dashboard.component.html');
