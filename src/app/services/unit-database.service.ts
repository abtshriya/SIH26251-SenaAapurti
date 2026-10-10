import { Injectable, signal, computed } from '@angular/core';

export interface ArmyUnit {
  id: string;
  name: string;
  formation: string;
  corps: string;
  command: string;
  station: string;
  address: string;
  pincode: string;
  sector: string;
  officerName: string;
  officerRole: string;
  serviceNo: string;
  bgImage: string;
  placeDescription: string;
  readiness: number;
  daysOfSupply: number;
  activeConvoys: number;
  activeIndents: number;
}

@Injectable({
  providedIn: 'root'
})
export class UnitDatabaseService {
  /**
   * Comprehensive Indian Army Units Database across all Commands of India
   * With full addresses, stations, and scenic location header imagery.
   */
  readonly allUnits: ArmyUnit[] = [
    {
      id: 'UN-14RM-LEH',
      name: '14 RAJPUT (MECHANISED)',
      formation: '3 Infantry Division / 14 Corps',
      corps: 'HQ 14 Corps ("Fire and Fury Corps")',
      command: 'Northern Command',
      station: 'Leh, Ladakh',
      address: 'Military Station Leh, Post Box 14, UT of Ladakh - 194101',
      pincode: '194101',
      sector: 'Eastern Ladakh / Shyok Axis (11,500 ft)',
      officerName: 'Major Amit Sharma',
      officerRole: 'Quartermaster & Logistics OC',
      serviceNo: 'IC-71044A',
      bgImage: '/images/sena_convoy_ladakh.jpg',
      placeDescription: 'Trans-Himalayan high-altitude plateau overlooking the Indus and Shyok valleys.',
      readiness: 96,
      daysOfSupply: 48,
      activeConvoys: 3,
      activeIndents: 2
    },
    {
      id: 'UN-102-SIACHEN',
      name: '102 INFANTRY BRIGADE ("SIACHEN BRIGADE")',
      formation: 'Siachen Operational Sector / 14 Corps',
      corps: 'HQ 14 Corps ("Fire and Fury Corps")',
      command: 'Northern Command',
      station: 'Partapur / Siachen Base Camp, Ladakh',
      address: '102 Inf Bde HQ, C/o 56 APO, Partapur, Nubra Valley, Ladakh - 194401',
      pincode: '194401',
      sector: 'Saltoro Ridge & Highest Battlefield in the World (18,800 ft)',
      officerName: 'Col R. S. Negi, SM',
      officerRole: 'Logistics Operations Controller',
      serviceNo: 'IC-62410M',
      bgImage: '/images/sena_winter_stocking.jpg',
      placeDescription: 'High-altitude sub-zero glacier terrain in the eastern Karakoram range.',
      readiness: 94,
      daysOfSupply: 62,
      activeConvoys: 4,
      activeIndents: 3
    },
    {
      id: 'UN-08MD-KARGIL',
      name: '8 MOUNTAIN DIVISION ("FOREVER IN OPERATIONS")',
      formation: 'Kargil & Dras Mountain Sector',
      corps: 'HQ 14 Corps ("Fire and Fury Corps")',
      command: 'Northern Command',
      station: 'Dras / Kargil, Ladakh',
      address: 'HQ 8 Mountain Division, Kumbathang, Kargil, UT of Ladakh - 194103',
      pincode: '194103',
      sector: 'NH-1D Zojila-Kargil Defense Axis (10,800 ft)',
      officerName: 'Lt Col Vikram Rana',
      officerRole: 'Division Logistics Staff Officer',
      serviceNo: 'IC-68192K',
      bgImage: '/images/sena_winter_convoy.jpg',
      placeDescription: 'Rugged snow-clad Himalayan peaks along the historic Tiger Hill and Tololing ridgelines.',
      readiness: 97,
      daysOfSupply: 55,
      activeConvoys: 2,
      activeIndents: 1
    },
    {
      id: 'UN-15C-SRINAGAR',
      name: 'HQ 15 CORPS ("CHINAR CORPS")',
      formation: 'Kashmir Valley Operational Area',
      corps: 'HQ 15 Corps ("Chinar Corps")',
      command: 'Northern Command',
      station: 'Badami Bagh Cantonment, Srinagar, J&K',
      address: 'Badami Bagh Cantonment, Srinagar, Jammu & Kashmir - 190004',
      pincode: '190004',
      sector: 'Pir Panjal & Kashmir Valley Security Grid',
      officerName: 'Brigadier S. K. Bhan',
      officerRole: 'Chief Logistics Officer (CLO)',
      serviceNo: 'IC-51204X',
      bgImage: '/images/units/srinagar_kashmir.jpg',
      placeDescription: 'Pristine Kashmir valley surrounded by snow-capped Pir Panjal mountains and Dal Lake.',
      readiness: 98,
      daysOfSupply: 70,
      activeConvoys: 5,
      activeIndents: 4
    },
    {
      id: 'UN-190-TAWANG',
      name: '190 MOUNTAIN BRIGADE',
      formation: '5 Mountain Division / 4 Corps',
      corps: 'HQ 4 Corps ("Gajraj Corps")',
      command: 'Eastern Command',
      station: 'Tawang, Arunachal Pradesh',
      address: '190 Mountain Brigade, Tawang Military Station, Arunachal Pradesh - 790104',
      pincode: '790104',
      sector: 'Kameng Sector / Sela Pass Axis (10,000 ft)',
      officerName: 'Major T. Dorjee',
      officerRole: 'Brigade Quartermaster',
      serviceNo: 'IC-73419N',
      bgImage: '/images/units/tawang_arunachal.jpg',
      placeDescription: 'Historic eastern Himalayan heights with mist-covered rhododendron valleys and Sela Pass.',
      readiness: 95,
      daysOfSupply: 52,
      activeConvoys: 3,
      activeIndents: 2
    },
    {
      id: 'UN-12C-JAISALMER',
      name: 'HQ 12 CORPS ("KONARK CORPS") / 11 RAPID',
      formation: 'Desert Strike & Mechanised Corps',
      corps: 'HQ 12 Corps ("Konark Corps")',
      command: 'Southern Command',
      station: 'Jaisalmer / Jodhpur, Rajasthan',
      address: 'Konark Cantonment, Jaisalmer Military Station, Rajasthan - 345001',
      pincode: '345001',
      sector: 'Thar Desert / Western Border Operational Grid',
      officerName: 'Lt Col Harshwardhan Singh',
      officerRole: 'Mechanised Supply & Fuel Controller',
      serviceNo: 'IC-65922P',
      bgImage: '/images/units/jaisalmer_thar.jpg',
      placeDescription: 'Golden Thar Desert sand dunes, sun-drenched Thar outposts, and sandstone battlements.',
      readiness: 99,
      daysOfSupply: 80,
      activeConvoys: 6,
      activeIndents: 1
    },
    {
      id: 'UN-09C-YOL',
      name: 'HQ 9 CORPS ("RISING STAR CORPS")',
      formation: 'Western Plains & Foothills Strike Group',
      corps: 'HQ 9 Corps ("Rising Star Corps")',
      command: 'Western Command',
      station: 'Yol Cantonment, Kangra, Himachal Pradesh',
      address: 'Yol Cantonment, Kangra District, Himachal Pradesh - 176052',
      pincode: '176052',
      sector: 'Dhauladhar Ranges & Shivalik Axis',
      officerName: 'Major Alok Kalia',
      officerRole: 'Forward Ordnance Officer',
      serviceNo: 'IC-70891H',
      bgImage: '/images/units/dharamshala_kangra.jpg',
      placeDescription: 'Majestic Dhauladhar snow peaks, emerald pine forests, and high-altitude tea valleys.',
      readiness: 98,
      daysOfSupply: 65,
      activeConvoys: 3,
      activeIndents: 2
    },
    {
      id: 'UN-33C-SUKNA',
      name: 'HQ 33 CORPS ("TRISHAKTI CORPS")',
      formation: 'North Bengal & Sikkim Border Defense',
      corps: 'HQ 33 Corps ("Trishakti Corps")',
      command: 'Eastern Command',
      station: 'Sukna / Siliguri Corridor, West Bengal',
      address: 'Trishakti Cantonment, Sukna, Siliguri, Darjeeling District, West Bengal - 734009',
      pincode: '734009',
      sector: 'Siliguri Chicken’s Neck Corridor & Sikkim Passes',
      officerName: 'Lt Col Debashish Roy',
      officerRole: 'Central Transit Logistics Director',
      serviceNo: 'IC-64811D',
      bgImage: '/images/sena_bridge_convoy.jpg',
      placeDescription: 'Sub-Himalayan Dooars forest foothills and the strategic Teesta river corridor.',
      readiness: 97,
      daysOfSupply: 58,
      activeConvoys: 4,
      activeIndents: 3
    },
    {
      id: 'UN-16C-NAGROTA',
      name: 'HQ 16 CORPS ("WHITE KNIGHT CORPS")',
      formation: 'Jammu Foothills & Line of Control',
      corps: 'HQ 16 Corps ("White Knight Corps")',
      command: 'Northern Command',
      station: 'Nagrota Cantonment, Jammu, J&K',
      address: 'White Knight Cantonment, Nagrota, Jammu, J&K - 181221',
      pincode: '181221',
      sector: 'Pir Panjal South & Chenab Valley Defense',
      officerName: 'Col Maninder Gill',
      officerRole: 'Theater Ammunition Officer',
      serviceNo: 'IC-60312T',
      bgImage: '/images/units/srinagar_kashmir.jpg',
      placeDescription: 'Shivalik ridges along the historic Tawi and Chenab river systems.',
      readiness: 96,
      daysOfSupply: 60,
      activeConvoys: 3,
      activeIndents: 2
    },
    {
      id: 'UN-04C-TEZPUR',
      name: 'HQ 4 CORPS ("GAJRAJ CORPS")',
      formation: 'Assam & Arunachal Pradesh Border Defense',
      corps: 'HQ 4 Corps ("Gajraj Corps")',
      command: 'Eastern Command',
      station: 'Tezpur Military Station, Sonitpur, Assam',
      address: 'Gajraj Cantonment, Tezpur, Sonitpur District, Assam - 784001',
      pincode: '784001',
      sector: 'Brahmaputra Valley & Eastern Border Logistics Lifeline',
      officerName: 'Major Bipul Saikia',
      officerRole: 'Riverine Convoy & Air-Drop Coordinator',
      serviceNo: 'IC-72990B',
      bgImage: '/images/units/tawang_arunachal.jpg',
      placeDescription: 'Mighty Brahmaputra riverfront against the distant silhouette of the Eastern Himalayas.',
      readiness: 95,
      daysOfSupply: 50,
      activeConvoys: 3,
      activeIndents: 1
    },
    {
      id: 'UN-HQ-DELHI',
      name: 'INTEGRATED DEFENSE HQ (ARMY HQ)',
      formation: 'Apex Strategic Logistics Directorate',
      corps: 'Master General of Sustenance (MGS Branch)',
      command: 'Army Headquarters',
      station: 'Sena Bhawan, New Delhi',
      address: 'Sena Bhawan, Rajaji Marg, South Block, New Delhi - 110011',
      pincode: '110011',
      sector: 'National Strategic Command & C4ISR Core',
      officerName: 'Lt Gen V. K. Rawat, PVSM, AVSM',
      officerRole: 'Master General of Sustenance',
      serviceNo: 'IC-48291X',
      bgImage: '/images/sena_bhawan_delhi.jpg',
      placeDescription: 'The prestigious central headquarters of the Indian Army in the heart of New Delhi.',
      readiness: 100,
      daysOfSupply: 90,
      activeConvoys: 12,
      activeIndents: 6
    }
  ];

  /** Currently selected active unit signal */
  private _selectedUnit = signal<ArmyUnit>(this.allUnits[0]);
  readonly selectedUnit = computed(() => this._selectedUnit());

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
    return this.allUnits.filter(u => u.command.toLowerCase().includes(command.toLowerCase()));
  }
}
