export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  points?: string[];
  note?: string;
  badge?: string;
  relatedLink?: {
    label: string;
    route?: string;
    fragment?: string;
  };
}

export interface FaqCategory {
  id: string;
  title: string;
  route: string;
  icon: string;
  tagline: string;
  description: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'general',
    title: 'General & Getting Started',
    route: '/faq/general',
    icon: '🛡️',
    tagline: 'SYSTEM OVERVIEW & DEFENSE MANDATE',
    description: 'Essential operational overview of Project SenaAapurti—the Indian Army\'s centralized predictive logistics orchestration platform designed to eliminate supply friction and guarantee combat sustenance across forward theaters.',
    items: [
      {
        id: 'what-is-senaaapurti',
        question: 'What is SenaAapurti and what core operational challenge does it solve?',
        badge: 'Core Overview',
        answer: 'SenaAapurti (सेना आपूर्ति) is the Indian Army\'s dedicated, AI-assisted logistics orchestration platform. It is engineered to bridge the critical supply chain divide between Central Ordnance Depots (CODs) / Strategic Reserve Depots and forward deployed military units, pickets, and isolated mountain outposts.',
        points: [
          'Eliminates unexpected stockouts by shifting military logistics from reactive replenishment to anticipatory, proactive provisioning.',
          'Provides continuous visibility across all 7 Indian Army Commands, multi-echelon depots, and regimental stores.',
          'Synchronizes replenishment schedules ahead of extreme winter mountain pass closures in Ladakh, Kargil, and Eastern borders.',
          'Replaces cumbersome manual paper-based indents with cryptographically verified digital supply vouchers.'
        ],
        note: 'SenaAapurti is maintained under the Directorate General of Ordnance Services (DGOS) and Master General of Sustenance (MGS) branch.'
      },
      {
        id: 'intended-users',
        question: 'Who are the primary intended users across military formations?',
        badge: 'User Ecosystem',
        answer: 'The system is architected around two synchronized tiers of defense logisticians and operational personnel:',
        points: [
          'Strategic Command & Ordnance Staff: Master General of Sustenance (MGS), DGOS Directorates, Theater Army Commanders, Corps Logistics Officers, and Central Depot Commandants managing theater-wide quotas and asset redistribution.',
          'Tactical Field Formations: Regimental Quartermasters (RQMs), Battalion Logistics Officers (BLOs), and Store In-Charges managing daily regimental store balances, rations, ammunition basic loads (UBL), and urgent replenishment indents.',
          'Convoy & Fleet Escort Personnel: Army Service Corps (ASC) and Army Ordnance Corps (AOC) column escort officers monitoring in-transit vehicles and milestone checkposts.',
          'Technical & Support Staff: Signal Corps administrators managing ASCON-NET nodes, authentication credentials, and cryptographic field terminals.'
        ]
      },
      {
        id: 'portals-difference',
        question: 'What is the operational distinction between the Command Portal and the Tactical Unit Portal?',
        badge: 'System Architecture',
        answer: 'To enforce strict role-based access control (RBAC) and prevent operational clutter, SenaAapurti divides user functionality into two dedicated terminal environments:',
        points: [
          'Command / Admin Portal: Designed for Army HQ, Theater Commands, and Ordnance Depots. Focuses on macro-level readiness HUDs, multi-theater India Logistics GIS mapping, national depot balancing, wargame/what-if stress simulations, high-level indent approvals, and DEFCON readiness tracking.',
          'Tactical Unit Portal: Designed for individual regiments, battalions, and forward pickets. Focuses on micro-level store ledgers across Classes I to IX, Days of Supply (DOS) monitors, automated indent generation, convoy milestone arrival tracking, and dispatching Flash SOS emergency air-drop taskings.'
        ]
      },
      {
        id: 'supply-classes',
        question: 'Which defense supply classes are orchestrated through the platform?',
        badge: 'Inventory Scope',
        answer: 'SenaAapurti standardizes inventory classification following the Indian Armed Forces supply classification system:',
        points: [
          'Class I — Subsistence: Dry rations, fresh provisions, packaged high-altitude ration packs (HARP), survival biscuits, and emergency field rations.',
          'Class III — Petroleum, Oil & Lubricants (POL): Sub-Zero High-Speed Diesel (HSD), Aviation Turbine Fuel (ATF), heating kerosene (SKO), hydraulic fluids, and extreme-cold specialized lubricants.',
          'Class V — Munitions & Explosives: Small-arms ammunition, artillery shells, mortar bombs, rockets, guided missiles, grenades, and demolition charges.',
          'Class IX — Repair Parts & Vehicle Spares: Armoured vehicle tracks, engine components, winter vehicle snow chains, optical sub-assemblies, and heavy equipment replacement units.'
        ]
      },
      {
        id: 'connectivity-offline',
        question: 'How does SenaAapurti maintain functionality during communications or satellite blackout?',
        badge: 'Operational Resilience',
        answer: 'Recognizing that forward pickets and high-altitude mountain passes experience frequent satellite jamming, severe snowstorms, and communication blackouts, SenaAapurti is engineered with offline-first resilience.',
        points: [
          'Local Encrypted Storage: Field handheld terminals and outpost clients record daily store receipts, vouchers, and muster tallies into a local encrypted database.',
          'Autonomous Local Operation: Store ledgers continue to decrement and compute localized Days of Supply (DOS) even without an active network connection.',
          'Cryptographic Delta Sync: As soon as a secure line-of-sight VHF/UHF, satellite, or ASCON network link is re-established, local ledgers auto-reconcile with central depot databases using cryptographic delta merges.'
        ]
      },
      {
        id: 'security-architecture',
        question: 'What cybersecurity and access controls protect platform telemetry?',
        badge: 'Cyber Security',
        answer: 'All data transmissions and user sessions conform to strict military cyber standards:',
        points: [
          'Mandatory military two-factor authentication (2FA) with official Army Service Numbers.',
          'Role-based permissions limiting tactical units to their assigned battalion accounts, while strategic cross-depot transfers require senior ordnance authorization.',
          'End-to-end telemetry encryption utilizing certified sovereign ASCON protocol standards.',
          'Complete audit logging of every indent draft, voucher clearance, and store adjustment for defense audit compliance.'
        ]
      }
    ]
  },
  {
    id: 'platform-features',
    title: 'Platform Features & Capabilities',
    route: '/faq/platform-features',
    icon: '⚙️',
    tagline: 'MODULAR DEFENSE LOGISTICS ENGINE',
    description: 'Detailed explanation of the practical operational capabilities powering SenaAapurti—including multi-tier inventory intelligence, digital indenting, live movement monitoring, and wargame simulations.',
    items: [
      {
        id: 'inventory-intelligence',
        question: 'How does Inventory Intelligence provide visibility from Central Depots to Regimental Stores?',
        badge: 'Feature 02',
        answer: 'Inventory Intelligence establishes a unified, multi-echelon stock ledger that eliminates blind spots between central holding formations and forward fighting units.',
        points: [
          'Depot-to-Kote Traceability: Connects Central Ordnance Depots (CODs), Forward Supply Depots (FSDs), and Regimental Stores into a live, synchronised ledger.',
          'Digital Barcode & Batch Tracking: Monitors store items with military serial numbers and QR/RFID tagging to track production batches and shelf-life expiries.',
          'Defeats Shadow Hoarding: Provides authorized commanders with real-time insight into available, reserved, and in-transit assets across all depot tiers.',
          'Automated Stock Alerts: Triggers color-coded warnings (Green/Amber/Red) when unit inventory breaches safety buffer thresholds.'
        ]
      },
      {
        id: 'automated-indents',
        question: 'What is the automated indenting workflow for supply requisitions?',
        badge: 'Feature 03',
        answer: 'The Supply Requests & Automated Indents module modernizes the military requisition process from manual paper vouchers into a streamlined, audited digital workflow.',
        points: [
          'Automated Calculation: Calculates required replenishment based on active unit troop strength, authorized Unit Basic Loads (UBL), and current consumption rates.',
          'Priority Classification: Supports three standardized priority levels—Routine, Operational Priority 1, and Flash SOS Emergency.',
          'Multi-Tier Digital Signatures: Automatically routes draft vouchers through battalion command, brigade logistics, and depot allocation cells with verifiable digital stamps.',
          'Live Lifecycle Tracking: Enables Quartermasters to track whether an indent is Drafted, Authorized, Depot-Assigned, Loaded, or Dispatched.'
        ]
      },
      {
        id: 'logistics-movement',
        question: 'How are military columns and logistics movements tracked in real time?',
        badge: 'Feature 04',
        answer: 'The Logistics Movement Tracking module oversees the safe, timely transit of supply convoys along strategic military axes and mountain highway sectors.',
        points: [
          'GPS & Transponder Telemetry: Tracks active convoy columns, vehicle counts, payload manifests, and driver escort details.',
          'Milestone Checkposts: Logs progress as convoys clear vital Traffic Control Posts (TCPs), transit staging camps, and mountain bypass corridors.',
          'Delay & Stoppage Detection: Highlights stationary columns or transit lags exceeding scheduled convoy halt allowances.',
          'Arrival Reconciliation: Generates an automatic digital handover receipt upon vehicle arrival and store unloading at the destination formation.'
        ]
      },
      {
        id: 'reports-analytics',
        question: 'What reporting intelligence and audit capabilities does the analytics engine generate?',
        badge: 'Feature 09',
        answer: 'The Reports & Analytics module provides executive readiness summaries and comprehensive audit logs for Army Leadership and ordnance inspectors.',
        points: [
          'Theater Readiness Index: Compiles aggregate Days of Supply (DOS) readiness metrics across Northern, Eastern, and Western commands.',
          'Consumption Trend Audits: Identifies seasonal consumption anomalies, equipment wear patterns, and fuel burn spikes.',
          'Wastage & Shelf-Life Monitoring: Highlights rations and munitions nearing depot expiry to facilitate timely rotation before deterioration occurs.',
          'Defense Standard Exports: Generates audited official reports in standardized PDF, CSV, and secure printable defense formats.'
        ]
      },
      {
        id: 'what-if-simulation',
        question: 'What is the purpose of the What-If Crisis Simulation module?',
        badge: 'Feature 08',
        answer: 'What-If Crisis Simulation is an isolated wargaming sandbox that allows logistics planners to stress-test supply resilience without affecting live operational data.',
        points: [
          'Multi-Front Mobilization: Models the supply surge required if multiple strike corps mobilize simultaneously along border theaters.',
          'Pass Blockade Scenarios: Simulates sudden 30-day blockades of critical axes (such as Zojila or Sela pass) and tests alternate depot replenishment routes.',
          'Ammunition Surge Testing: Evaluates how rapidly reserve depots would be depleted under high-intensity Class V munitions burn rates.',
          'Depot Deficit Mitigation: Highlights which regional depots require immediate buffer reinforcement before simulated crises materialize.'
        ]
      },
      {
        id: 'weather-terrain-integration',
        question: 'How do weather and terrain feeds integrate into daily logistics operations?',
        badge: 'Feature 06',
        answer: 'SenaAapurti integrates terrain and meteorological telemetry to safeguard high-altitude convoys and prevent stranded columns.',
        points: [
          'Avalanche Advisory Feeds: Ingests ground sensor warnings from DRDO Defence Geoinformatics Research Establishment (DGRE) for snowbound passes.',
          'Radar & Satellite Feeds: Monitors Doppler weather radar feeds for heavy snowfall, black ice, and rainfall probabilities along active transit corridors.',
          'Pass Clearance Status: Displays real-time operational status (Open, Restricted, Chains Required, Closed) for high-altitude passes.',
          'Dynamic Advisory Banners: Automatically alerts logistics dispatchers to pause convoy release during extreme weather warnings.'
        ]
      }
    ]
  },
  {
    id: 'ai-intelligence',
    title: 'AI & Predictive Intelligence',
    route: '/faq/ai-intelligence',
    icon: '🧠',
    tagline: 'ALGORITHMS, TELEMETRY & DECISION SUPPORT',
    description: 'Detailed breakdown of predictive analytics, neural demand forecasting, Bayesian risk engines, route optimization, and Explainable AI (XAI)—clearly distinguishing active baseline features from developmental capabilities.',
    items: [
      {
        id: 'predictive-analytics',
        question: 'How does Predictive Analytics ingest multidimensional defense telemetry?',
        badge: 'AI Pillar 01',
        answer: 'The Predictive Analytics engine processes diverse operational data feeds to model dynamic military burn rates across varying defense readiness states.',
        points: [
          'Multi-Year Historical Ledgers: Ingests up to 15 years of seasonal consumption records for ammunition, POL, rations, and equipment spares.',
          'Formation Demographics: Factors in troop strength, troop movements, high-altitude acclimatization stages, and scheduled training exercises.',
          'Environmental Attributes: Incorporates altitude gradients, temperature drops below -20°C, and historical weather patterns.',
          'Theater Readiness State: Adjusts projected burn rates dynamically according to peacetime, exercise, or escalated DEFCON states.'
        ],
        note: 'Baseline statistical forecasting is actively deployed; deep learning multidimensional signal ingestion is deployed in selective operational trials.'
      },
      {
        id: 'demand-forecasting',
        question: 'How does Demand Forecasting project seasonal winter burn rates 30–90 days ahead?',
        badge: 'AI Pillar 02',
        answer: 'Demand Forecasting anticipates non-linear consumption surges before seasonal road closures cut off ground communication to forward pickets.',
        points: [
          'Anticipates Cold-Wave Surges: When ambient temperatures drop below -25°C, fuel consumption for heating kerosene and sub-zero diesel climbs non-linearly; the model calculates these exact surges.',
          'Advance Buffer Timing: Generates pre-positioning requirements 30 to 90 days in advance, allowing depots to complete winter stocking by October.',
          'Class-Specific Modeling: Separates predictable subsistence curves (Class I) from variable munitions allocations (Class V) and extreme-cold POL (Class III).',
          'Minimizes Emergency Air-Drops: Advance ground stocking dramatically reduces the operational necessity of cost-intensive winter helicopter drops.'
        ]
      },
      {
        id: 'risk-vulnerability',
        question: 'How does Risk Prediction & Vulnerability Scoring detect impending stockouts?',
        badge: 'AI Pillar 03',
        answer: 'The vulnerability scoring engine identifies which forward pickets are at the greatest risk of isolation or inventory depletion.',
        points: [
          'Bayesian Risk Engine: Combines current stock balances, projected daily burn rates, distance from nearest depot, and pass closure probabilities.',
          'Vulnerability Index (0–100): Assigns a dynamic vulnerability score to each forward post, ranking them from Secure to Critical.',
          'Early Buffer Warnings: Flags formations projected to reach critical reserve levels within 14 to 21 days, giving commanders ample time to react.',
          'Actionable Prioritization: Ensures limited transport aircraft or convoy escorts are routed first to posts with the highest vulnerability score.'
        ]
      },
      {
        id: 'route-intelligence',
        question: 'What algorithms power Route Intelligence and bypass hazard avoidance?',
        badge: 'AI Pillar 04',
        answer: 'Route Intelligence assists convoy dispatchers by evaluating road stability and identifying safe bypass corridors when primary axes are compromised.',
        points: [
          'Terrain Risk Modeling: Evaluates road slope gradients, black ice sectors, landslide vulnerability, and choke points.',
          'Bypass Corridors: When a primary pass (e.g., Zojila or Sela) is blocked, the engine calculates viable secondary axes and adjusts convoy transit schedules.',
          'Fuel & Load Adaptation: Recalculates expected vehicle fuel consumption and payload stress based on steeper detour gradients.',
          'Dynamic Convoy Staging: Recommends intermediate transit camps for overnight halts based on safe distance intervals.'
        ]
      },
      {
        id: 'eta-prediction',
        question: 'How does the military ETA Prediction Engine calculate convoy arrival times?',
        badge: 'AI Pillar 05',
        answer: 'Unlike commercial navigation tools, SenaAapurti\'s ETA engine is calibrated specifically for military convoy columns traversing extreme terrain.',
        points: [
          'Engine De-Rating: Accounts for mechanical performance degradation in heavy military trucks operating above 11,000 feet.',
          'Operational Friction Delays: Factors in mandatory convoy spacing, snow chain mounting delays at pass foot-hills, and Traffic Control Post clearances.',
          'Weather Impact Curves: Adjusts speed estimates based on real-time snowfall intensity and road icing conditions.',
          'Confidence Bounds: Provides convoy commanders with high-confidence arrival windows rather than unrealistic single-point estimates.'
        ]
      },
      {
        id: 'explainable-ai',
        question: 'What is Explainable AI (XAI) and why is transparent decision-support mandatory?',
        badge: 'AI Pillar 06',
        answer: 'In defense logistics, automated "black-box" recommendations are strictly unacceptable. Every recommendation produced by SenaAapurti is accompanied by clear, auditable explanations.',
        points: [
          'Contributing Factors: Displays the exact telemetry signals driving the suggestion (e.g., "72-hour heavy snow forecast + 14-day stock reserve threshold").',
          'Confidence Rating: Shows the statistical confidence level associated with the forecast or route recommendation.',
          'Expected Impact: Outlines the projected improvement in unit Days of Supply (DOS) if the recommendation is accepted.',
          'Vetted Alternatives: Presents alternative options (e.g., surface transfer vs. aerial tasking) so military commanders retain final decision authority.'
        ]
      },
      {
        id: 'implemented-vs-proposed',
        question: 'Which AI capabilities are actively operational versus proposed developmental phases?',
        badge: 'System Status',
        answer: 'To maintain technical integrity and operational clarity, SenaAapurti distinguishes active baseline features from advanced AI capabilities currently under development:',
        points: [
          'Actively Implemented: Rule-based demand forecasting, automated Days of Supply (DOS) calculation, milestone checkpost tracking, structured digital indents, and deterministic What-If simulation modeling.',
          'Under Operational Field Trial: Bayesian stockout vulnerability scoring, terrain route intelligence feeds, and automated explainable recommendation engines.',
          'Proposed / Future Roadmap: Deep Recurrent LSTM neural networks trained on extensive historical defense datasets, satellite radar (SAR) real-time pass condition feeds, and autonomous drone aerial supply integration.'
        ]
      }
    ]
  },
  {
    id: 'logistics-operations',
    title: 'Logistics Operations & Tracking',
    route: '/faq/logistics-operations',
    icon: '🚚',
    tagline: 'PRACTICAL FIELD PROCEDURES & PROTOCOLS',
    description: 'Practical operating procedures for quartermasters, convoy commanders, and ordnance officers—covering stock monitoring, Days of Supply thresholds, transit milestones, and SOS procedures.',
    items: [
      {
        id: 'days-of-supply',
        question: 'What is Days of Supply (DOS) and how are readiness thresholds determined?',
        badge: 'Core Metric',
        answer: 'Days of Supply (DOS) is the primary readiness metric in military logistics. It represents how many days a formation or picket can sustain combat operations with its currently held stock at standard consumption burn rates.',
        points: [
          'Mathematical Formula: DOS = (Total Usable On-Hand Inventory) ÷ (Projected Daily Consumption Rate).',
          'Green Status (>30 Days): Healthy reserve buffer; standard routine replenishment applies.',
          'Amber Status (15–30 Days): Buffer is tightening; automated indent recommended; prioritised for next scheduled convoy.',
          'Red Status (<15 Days): Critical stock threshold; triggers high-priority alert to Brigade HQ and DGOS allocation cell.',
          'Flash Critical (<7 Days): Immediate operational hazard; triggers Flash SOS emergency replenishment protocol.'
        ]
      },
      {
        id: 'convoy-milestones',
        question: 'How are convoy transit milestones and checkpoint clearances updated?',
        badge: 'Transit Protocol',
        answer: 'Convoys update their status sequentially as they traverse military transit axes:',
        points: [
          'Departure Dispatch: The issuing depot records departure timestamp, convoy commander name, vehicle serial numbers, and payload seal verification.',
          'Traffic Control Posts (TCP): Escort commanders check in at intermediate TCPs via ruggedized mobile terminals or VHF radio reports, confirming column integrity and passing times.',
          'Hazard Halts: If a convoy halts unexpectedly due to mechanical breakdown or road blockades, an incident report is submitted to recalculate column ETA.',
          'Receiving Muster: The destination unit verifies payload seals and logs electronic confirmation upon arrival, closing out the movement ticket.'
        ]
      },
      {
        id: 'winter-stocking',
        question: 'What special operational procedures govern high-altitude winter stocking (Advance Winter Stocking - AWS)?',
        badge: 'SOP High-Altitude',
        answer: 'High-Altitude winter stocking is a strategic defense priority for formations deployed in Northern and Eastern mountain sectors.',
        points: [
          'Seasonal Window: Stocking commences in May/June and must conclude by October before mountain passes are sealed by heavy snowfall.',
          '6–7 Month Buffer: Forward pickets are stocked with a 180 to 210-day buffer of dry rations, sub-zero fuel, and essential ammunition.',
          'Cold-Resistant Packaging: Class III fuels are stored in dedicated insulated bladders or sub-zero drums; rations are packaged against freezing and rodent intrusion.',
          'Audited Verification: Muster boards conducted by formation ordnance officers verify 100% stockpile completion ahead of winter cutoff.'
        ]
      },
      {
        id: 'emergency-sos',
        question: 'When and how should a Flash SOS Emergency Requisition be dispatched?',
        badge: 'Emergency SOP',
        answer: 'A Flash SOS Emergency requisition is strictly reserved for urgent situations where regular supply lines have failed or an acute crisis has occurred.',
        points: [
          'Authorized Triggers: Severe avalanche isolation, unexpected combat expenditure, contamination/loss of fuel reserves, or critical medical emergencies.',
          'Authorization Level: Must be submitted by an officer with Level 2 clearance (Battalion Commander, RQM, or higher).',
          'Immediate Escalation: Flash SOS vouchers bypass routine approval queues, triggering audible and visual priority alerts in DGOS and Theater Operations rooms.',
          'Aerial Tasking: Automatically initiates coordination with the nearest Army Aviation or Air Force helicopter dispatch staging base for aerial drops.'
        ]
      },
      {
        id: 'damaged-discrepancies',
        question: 'How are supply shortfalls, seal breakages, or damaged deliveries reconciled?',
        badge: 'Discrepancy SOP',
        answer: 'When a receiving unit unloads stores and discovers missing items, broken container seals, or contaminated fuel:',
        points: [
          'Discrepancy Voucher (DV): The receiving Quartermaster logs an electronic Discrepancy Voucher in the Unit Portal within 24 hours of delivery.',
          'Photographic Evidence: Damaged seals or contaminated stores are documented using the rugged mobile terminal camera.',
          'Formal Inquiry: A joint inquiry is conducted between the issuing depot, the transit escort commander, and the receiving unit.',
          'Automated Replacement: The system automatically generates a replacement requisition for the damaged shortfall, ensuring unit reserves are restored.'
        ]
      },
      {
        id: 'inter-depot-redistribution',
        question: 'How is inter-depot stock rebalancing executed between Northern and Eastern commands?',
        badge: 'Macro Operations',
        answer: 'When one theater command faces an acute stock deficit while an adjacent command holds surplus inventory, the Command Portal orchestrates lateral rebalancing:',
        points: [
          'Lateral Transfer Suggestion: The platform identifies matching surplus classes in nearby depots with viable rail or road connections.',
          'Ordnance Clearance: DGOS planners authorize an Inter-Depot Issue Voucher (IDIV) directly in the Command Portal.',
          'Transport Allocation: Automatically creates military transit movement orders for designated logistics columns to move the balanced stores.',
          'Balanced Readiness: Restores theater-wide equilibrium without waiting for long-lead manufacturing contracts from civilian ordnance factories.'
        ]
      }
    ]
  },
  {
    id: 'user-guidelines',
    title: 'User Guides & Access',
    route: '/faq/user-guidelines',
    icon: '📖',
    tagline: 'OPERATING MANUALS & INTERFACE PROCEDURES',
    description: 'Detailed user guidelines explaining how military officers, quartermasters, and logistics personnel navigate SenaAapurti, manage ledgers, authenticate sessions, and file requisitions.',
    items: [
      {
        id: 'login-2fa-guide',
        question: 'What is the step-by-step procedure for military login and two-factor authentication (2FA)?',
        badge: 'Security SOP',
        answer: 'Access to SenaAapurti is restricted to authorized military personnel using standardized credential verification:',
        points: [
          'Step 1 — Navigate: Click "Access Portal" from the top navigation bar or homepage.',
          'Step 2 — Select Role: Choose either "Command / Admin Portal" or "Tactical Unit Portal" depending on your posting.',
          'Step 3 — Credentials: Enter your official Army Service Number (e.g., IC-XXXXXX for Officers, JC-XXXXXX for JCOs) and military account password.',
          'Step 4 — Security CAPTCHA: Solve the dynamic alphanumeric verification challenge.',
          'Step 5 — 2FA Challenge: Enter the 6-digit one-time cryptographic passkey from your authorized military token or registered defense terminal.',
          'Step 6 — Verify Unit: In Unit Portal mode, ensure the station banner matches your active regiment before executing store entries.'
        ]
      },
      {
        id: 'command-user-guide',
        question: 'How do formation commanders and ordnance staff utilize the Command User Guide?',
        badge: 'Guide 01',
        answer: 'The Command User Guide outlines the operational workflow for senior headquarters staff operating in the Command Portal:',
        points: [
          'National Readiness HUD: Review theater-level Days of Supply (DOS) indicators across Northern, Eastern, Western, Southern, and Central commands.',
          'Logistics GIS Map: Inspect real-time depot positions, active transit columns, and weather hazard overlays across the national grid.',
          'Inventory Balancing: Authorize inter-depot stock transfers between Central Ordnance Depots to eliminate regional reserve deficits.',
          'Simulation Wargames: Configure scenario parameters (troop mobilization numbers, closed mountain axes) in the What-If Simulator.',
          'Requisition Authorizations: Review and approve high-priority unit indents requiring higher-echelon clearance.'
        ]
      },
      {
        id: 'unit-user-guide',
        question: 'How do Regimental Quartermasters (RQM) navigate the Unit User Guide?',
        badge: 'Guide 02',
        answer: 'The Unit User Guide provides tactical instructions for battalion logisticians managing field stores:',
        points: [
          'Unit Dashboard Inspection: Check the current regiment Days of Supply (DOS) overview and color-coded stock health gauges.',
          'Store Receipt Audits: Confirm and digitally sign for stores delivered by incoming ASC/AOC supply convoys.',
          'Daily Consumption Logging: Record daily ration, fuel, and ammunition expenditures to maintain accurate burn rates.',
          'Unit Basic Load (UBL) Audit: Perform monthly muster audits to ensure battalion war reserves meet authorized military scales.',
          'Emergency SOS Dispatch: Access the Flash SOS emergency requisition interface during acute operational crises.'
        ]
      },
      {
        id: 'inventory-management-guide',
        question: 'What are the standard operating steps for maintaining store ledgers across Classes I to IX?',
        badge: 'Guide 04',
        answer: 'The Inventory Management Guide standardizes ledger entry protocols for military storekeepers:',
        points: [
          'Classification Hygiene: Ensure every inventory item is correctly categorized under Class I (Rations), Class III (POL), Class V (Ammunition), or Class IX (Spares).',
          'Batch & Expiry Logging: Input lot numbers and manufacturing expiry dates for rations and munitions during initial receipt.',
          'Buffer Threshold Setting: Set unit reorder points (Minimum Safe Buffer) based on formation geography (e.g., 60-day buffer for snowbound pickets vs 20-day buffer for plains).',
          'Physical Muster Reconciliation: Conduct periodic physical stock counts and log variance reconciliations in the ledger.'
        ]
      },
      {
        id: 'supply-request-guide',
        question: 'How do units draft, sign, and monitor requisition indents across priority scales?',
        badge: 'Guide 05',
        answer: 'The Supply Request Guide walks quartermasters through submitting official replenishment vouchers:',
        points: [
          'Initiate Indent: In the Unit Portal, select "New Supply Indent" and pick the required item from the military catalog.',
          'Review Auto-Filled Quantities: Review the system-suggested quantity or enter operational requirement justification.',
          'Select Priority Scale: Choose "Routine" for scheduled replenishments, "Operational Priority 1" for accelerated delivery, or "Flash SOS" for life-safety emergencies.',
          'Digital Signature: Apply your authorized military digital signature credentials to validate the voucher.',
          'Monitor Dispatch: Track voucher progress as it transitions from "Pending Approval" to "Depot Assigned", "Dispatched", and "Delivered".'
        ]
      },
      {
        id: 'convoy-movement-guide',
        question: 'What are the guidelines for Convoy Escort Commanders during transit?',
        badge: 'Guide 06',
        answer: 'The Logistics Movement Guide defines responsibilities for column commanders traversing military axes:',
        points: [
          'Pre-Departure Manifest: Verify vehicle count, payload securement, driver documentation, and spare snow chains before departure.',
          'Milestone Logging: Confirm arrival at scheduled Traffic Control Posts (TCPs) via rugged mobile client.',
          'Hazard Halts: Report any unexpected road blockages, avalanche hazards, or engine breakdowns to headquarters within 15 minutes of occurrence.',
          'Destination Handover: Oversee physical offloading, joint seal inspection, and electronic delivery receipt signing with the receiving unit Quartermaster.'
        ]
      }
    ]
  },
  {
    id: 'support',
    title: 'Troubleshooting & Support',
    route: '/faq/support',
    icon: '🛠️',
    tagline: 'DIAGNOSTICS & VERIFIED OFFICIAL HOTLINES',
    description: 'Practical troubleshooting solutions for credential lockouts, offline data synchronization, GPS transponder lags, and verified official military support contact details.',
    items: [
      {
        id: 'login-troubleshooting',
        question: 'What should I do if my Army Service Number login fails or is temporarily locked?',
        badge: 'Login Issue',
        answer: 'If you encounter login authentication difficulties in SenaAapurti:',
        points: [
          'Check Formatting: Ensure your Army Service Number includes the correct prefix (e.g., IC-, JC-, SS-) in uppercase without spaces.',
          'Account Lockout Policy: Following 5 consecutive incorrect password entries, your account is locked for 15 minutes as a cybersecurity precaution.',
          'Token De-synchronization: If your 2FA cryptographic token is out of sync, ensure your terminal clock is calibrated to Indian Standard Time (IST).',
          'Password Reset: Contact your formation Unit Security Officer or Corps of Signals Helpdesk for cryptographic credential reset authorization.'
        ]
      },
      {
        id: 'sync-troubleshooting',
        question: 'Why is local inventory data not synchronizing with the central ordnance depot?',
        badge: 'Data Sync',
        answer: 'Data synchronization delays occur when operating in degraded communication theaters:',
        points: [
          'Check Connectivity: Verify that your terminal is linked to an authorized military ASCON-NET node or designated tactical satellite link.',
          'Offline Mode Indicator: If an amber "Offline Cache Active" indicator is visible, your entries are safely stored on the local encrypted drive.',
          'Forced Sync Trigger: When network connectivity returns, click "Sync Now" in the system status bar to trigger immediate cryptographic reconciliation.',
          'Conflict Resolution: If the same ledger voucher was modified simultaneously, the system presents a side-by-side reconciliation screen for Quartermaster confirmation.'
        ]
      },
      {
        id: 'tracking-troubleshooting',
        question: 'What is the procedure when convoy GPS transponder telemetry appears offline?',
        badge: 'Telemetry Issue',
        answer: 'High-altitude gorges, deep ravines, and mountain tunnels frequently cause temporary GPS signal attenuation:',
        points: [
          'Expected Dead Zones: Certain mountain sectors (e.g., Zojila bypass or high-altitude passes) have known satellite shadow zones.',
          'Manual Milestone Check-In: Escort commanders should perform a voice radio check-in at the nearest Traffic Control Post (TCP) to record physical milestone progress.',
          'Transponder Hardware Reset: If the beacon unit loses power, cycle the 24V vehicle power switch and verify the green satellite lock LED.',
          'Report Malfunction: If hardware remains unresponsive, submit a vehicle telemetry ticket in the Support & Help Centre.'
        ]
      },
      {
        id: 'voucher-error-troubleshooting',
        question: 'How do I resolve indent authorization errors or submission blocks?',
        badge: 'Requisition Error',
        answer: 'If your requisition indent submission is rejected or blocked by the portal:',
        points: [
          'Scale Limit Exceeded: Verify that the requisitioned quantity does not exceed the unit\'s authorized Unit Basic Load (UBL) entitlement without an operational justification note.',
          'Clearance Level: Operational Priority 1 and Flash SOS indents require Level 2 user credentials; verify that your login role has appropriate clearance.',
          'Duplicate Indent: The system automatically blocks submission if an identical requisition for the same line item is already open and pending depot allocation.',
          'Expired Token: Re-authenticate your session if your digital signature token timed out while drafting the indent.'
        ]
      },
      {
        id: 'verified-contact-hotlines',
        question: 'What are the verified official support hotlines and technical control rooms?',
        badge: 'Official Directory',
        answer: 'For operational emergencies, logistics coordination, and technical helpdesk support, contact verified official Indian Army channels:',
        points: [
          'Army HQ 24x7 Control Room: 1800-11-SENA (7362) (Toll-Free Defense Hotline)',
          'Northern Command Ops Cell: ASCON Extension: 4421 / 4422',
          'Technical Helpdesk (Corps of Signals): support.senaaapurti@nic.in',
          'Class V Munitions Emergency Hotline: 1800-22-AMMO (2666)',
          'Official Electronic Gateways: dgos.sec@nic.in • senaaapurti.hq@gov.in'
        ],
        note: 'Do not transmit classified tactical movement coordinates over unencrypted civil telephony lines.'
      },
      {
        id: 'raising-support-ticket',
        question: 'How do I raise a formal operational support ticket in SenaAapurti?',
        badge: 'Help Centre',
        answer: 'For non-urgent issues, system bug reports, or stock reconciliation inquiries:',
        points: [
          'Access Support: Navigate to the Support & Help Centre section on the homepage or via the FAQ sidebar.',
          'Fill Ticket Details: Provide Officer Name, official Army Service Number, and select Issue Category (Voucher Tracking, Convoy Telemetry, Stock Reconciliation, or Security Access).',
          'Describe Issue: Include relevant Voucher Reference # or Convoy ID in the message body.',
          'Submit & Track: Submit the form to receive an automated military tracking reference for Corps of Signals resolution.'
        ]
      }
    ]
  }
];

export function getFaqCategoryById(id: string): FaqCategory | undefined {
  return FAQ_CATEGORIES.find(c => c.id === id);
}

export function getAllFaqItems(): { category: FaqCategory; item: FaqItem }[] {
  const result: { category: FaqCategory; item: FaqItem }[] = [];
  for (const cat of FAQ_CATEGORIES) {
    for (const item of cat.items) {
      result.push({ category: cat, item });
    }
  }
  return result;
}

export function searchFaqItems(query: string): { category: FaqCategory; item: FaqItem }[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const all = getAllFaqItems();
  return all.filter(({ category, item }) => {
    return (
      item.question.toLowerCase().includes(cleanQuery) ||
      item.answer.toLowerCase().includes(cleanQuery) ||
      (item.badge && item.badge.toLowerCase().includes(cleanQuery)) ||
      (item.points && item.points.some(p => p.toLowerCase().includes(cleanQuery))) ||
      category.title.toLowerCase().includes(cleanQuery)
    );
  });
}
