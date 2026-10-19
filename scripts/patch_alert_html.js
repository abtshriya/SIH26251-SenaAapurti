const fs = require('fs');
const filePath = 'src/app/pages/command-dashboard/command-dashboard.component.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Tab 1.1 critical alert cards
const oldTab1AlertBlock = `<div class="alt-top-row">
                    <span class="alt-type-badge">{{ alt.type }}</span>
                    <span class="alt-sev-pill" [class.bg-red]="alt.severity === 'Critical'" [class.bg-green]="alt.status === 'AUTHORIZED'">{{ alt.status === 'AUTHORIZED' ? 'AUTHORIZED' : alt.severity }}</span>
                    <span class="alt-theater">{{ alt.theater }} • {{ alt.sector }}</span>
                  </div>
                  <h4 class="alt-headline">{{ alt.headline }}</h4>
                  <p class="alt-details">{{ alt.details }}</p>
                  <div class="alt-action-box">
                    <strong>{{ langService.t('Recommended Action:') }}</strong> {{ langService.translateText(alt.recommendedAction) }}
                  </div>`;

const newTab1AlertBlock = `<div class="alt-top-row">
                    <span class="alt-type-badge">{{ langService.t(alt.type) }}</span>
                    <span class="alt-sev-pill" [class.bg-red]="alt.severity === 'Critical'" [class.bg-green]="alt.status === 'AUTHORIZED'">{{ alt.status === 'AUTHORIZED' ? langService.t('AUTHORIZED') : langService.t(alt.severity) }}</span>
                    <span class="alt-theater">{{ langService.t(alt.theater) }} • {{ langService.t(alt.sector) }}</span>
                  </div>
                  <h4 class="alt-headline">{{ langService.t(alt.headline) }}</h4>
                  <p class="alt-details">{{ langService.t(alt.details) }}</p>
                  <div class="alt-action-box">
                    <strong>{{ langService.t('Recommended Action:') }}</strong> {{ langService.t(alt.recommendedAction) }}
                  </div>`;

// 2. Tab 1.7 recommendation cards
const oldTab7_1 = `                  {{ alt.severity | uppercase }} PRIORITY
                </span>
                <span class="rec-id-tag font-mono">#{{ alt.id }}</span>
                <span class="rec-type-tag">{{ alt.type }}</span>
              </div>
              <div class="hud-right-group">
                <span class="hud-timestamp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hud-clock-svg">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ alt.timestamp }}
                </span>
                <span class="hud-status-badge" [class.badge-authorized]="alt.status === 'AUTHORIZED'">
                  {{ alt.status === 'AUTHORIZED' ? '✓ AUTHORIZED & DISPATCHED' : 'AWAITING AUTHORIZATION' }}
                </span>`;

const newTab7_1 = `                  {{ langService.t(alt.severity) }} {{ langService.t('PRIORITY') }}
                </span>
                <span class="rec-id-tag font-mono">#{{ alt.id }}</span>
                <span class="rec-type-tag">{{ langService.t(alt.type) }}</span>
              </div>
              <div class="hud-right-group">
                <span class="hud-timestamp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hud-clock-svg">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ langService.t(alt.timestamp) }}
                </span>
                <span class="hud-status-badge" [class.badge-authorized]="alt.status === 'AUTHORIZED'">
                  {{ alt.status === 'AUTHORIZED' ? langService.t('✓ AUTHORIZED & DISPATCHED') : langService.t('AWAITING AUTHORIZATION') }}
                </span>`;

const oldTab7_2 = `<span class="loc-theater">{{ alt.theater }}</span>
                    <span class="loc-sep">•</span>
                    <span class="loc-sector">{{ alt.sector }}</span>
                  </div>
                </div>
              </div>
              <div class="loc-unit-chip" *ngIf="alt.affectedUnit">
                <span class="unit-lbl">{{ langService.t('TARGET FORMATION:') }}</span>
                <span class="unit-val">{{ alt.affectedUnit }}</span>`;

const newTab7_2 = `<span class="loc-theater">{{ langService.t(alt.theater) }}</span>
                    <span class="loc-sep">•</span>
                    <span class="loc-sector">{{ langService.t(alt.sector) }}</span>
                  </div>
                </div>
              </div>
              <div class="loc-unit-chip" *ngIf="alt.affectedUnit">
                <span class="unit-lbl">{{ langService.t('TARGET FORMATION:') }}</span>
                <span class="unit-val">{{ langService.t(alt.affectedUnit) }}</span>`;

const oldTab7_3 = `<h3 class="issue-headline">{{ alt.headline }}</h3>
              
              <div class="issue-desc-panel">
                <p class="issue-desc-text">{{ alt.details }}</p>
              </div>

              <div class="issue-commodity-strip" *ngIf="alt.affectedSupply">
                <span class="sup-lbl">{{ langService.t('AFFECTED COMMODITY / MATERIEL:') }}</span>
                <span class="sup-val">{{ alt.affectedSupply }}</span>`;

const newTab7_3 = `<h3 class="issue-headline">{{ langService.t(alt.headline) }}</h3>
              
              <div class="issue-desc-panel">
                <p class="issue-desc-text">{{ langService.t(alt.details) }}</p>
              </div>

              <div class="issue-commodity-strip" *ngIf="alt.affectedSupply">
                <span class="sup-lbl">{{ langService.t('AFFECTED COMMODITY / MATERIEL:') }}</span>
                <span class="sup-val">{{ langService.t(alt.affectedSupply) }}</span>`;

const oldTab7_4 = `<span class="factor-text">{{ fac }}</span>
                    </div>
                  </div>
                </div>

                <!-- Right Column: AI Reasoning & Confidence -->
                <div class="reasoning-card-box">
                  <div class="box-header">
                    <span class="box-title">{{ langService.t('NEURAL NETWORK REASONING') }}</span>
                    <span class="ai-prob-badge">92% CONFIDENCE</span>
                  </div>
                  <div class="reasoning-body">
                    <div class="confidence-bar-container">
                      <div class="conf-labels">
                        <span>{{ langService.t('Predictive Likelihood') }}</span>
                        <span class="conf-pct">92.4% PROBABILITY</span>
                      </div>
                      <div class="conf-progress-track">
                        <div class="conf-progress-fill" style="width: 92%;"></div>
                      </div>
                    </div>
                    <p class="ai-reasoning-para">{{ alt.aiExplanation }}</p>
                    <div class="impact-callout" *ngIf="alt.expectedImpact">
                      <span class="impact-tag">{{ langService.t('STRATEGIC IMPACT:') }}</span>
                      <span class="impact-text">{{ alt.expectedImpact }}</span>`;

const newTab7_4 = `<span class="factor-text">{{ langService.t(fac) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Right Column: AI Reasoning & Confidence -->
                <div class="reasoning-card-box">
                  <div class="box-header">
                    <span class="box-title">{{ langService.t('NEURAL NETWORK REASONING') }}</span>
                    <span class="ai-prob-badge">{{ langService.t('92% CONFIDENCE') }}</span>
                  </div>
                  <div class="reasoning-body">
                    <div class="confidence-bar-container">
                      <div class="conf-labels">
                        <span>{{ langService.t('Predictive Likelihood') }}</span>
                        <span class="conf-pct">{{ langService.t('92.4% PROBABILITY') }}</span>
                      </div>
                      <div class="conf-progress-track">
                        <div class="conf-progress-fill" style="width: 92%;"></div>
                      </div>
                    </div>
                    <p class="ai-reasoning-para">{{ langService.t(alt.aiExplanation) }}</p>
                    <div class="impact-callout" *ngIf="alt.expectedImpact">
                      <span class="impact-tag">{{ langService.t('STRATEGIC IMPACT:') }}</span>
                      <span class="impact-text">{{ langService.t(alt.expectedImpact) }}</span>`;

const oldTab7_5 = `<p class="remedy-action-text">{{ alt.recommendedAction }}</p>
                  <div class="remedy-alternatives" *ngIf="alt.alternativeActions && alt.alternativeActions.length > 0">
                    <span class="alt-label">{{ langService.t('FALLBACK CONTINGENCY:') }}</span>
                    <span class="alt-chip" *ngFor="let a of alt.alternativeActions">{{ a }}</span>`;

const newTab7_5 = `<p class="remedy-action-text">{{ langService.t(alt.recommendedAction) }}</p>
                  <div class="remedy-alternatives" *ngIf="alt.alternativeActions && alt.alternativeActions.length > 0">
                    <span class="alt-label">{{ langService.t('FALLBACK CONTINGENCY:') }}</span>
                    <span class="alt-chip" *ngFor="let a of alt.alternativeActions">{{ langService.t(a) }}</span>`;

// Execute replacements with CRLF normalization
function replaceNormalized(target, replacement) {
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

console.log('Replacing Tab 1.1 alert block:', replaceNormalized(oldTab1AlertBlock, newTab1AlertBlock));
console.log('Replacing Tab 1.7 HUD strip:', replaceNormalized(oldTab7_1, newTab7_1));
console.log('Replacing Tab 1.7 location box:', replaceNormalized(oldTab7_2, newTab7_2));
console.log('Replacing Tab 1.7 issue box:', replaceNormalized(oldTab7_3, newTab7_3));
console.log('Replacing Tab 1.7 explain grid:', replaceNormalized(oldTab7_4, newTab7_4));
console.log('Replacing Tab 1.7 remedy text:', replaceNormalized(oldTab7_5, newTab7_5));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated command-dashboard.component.html');
