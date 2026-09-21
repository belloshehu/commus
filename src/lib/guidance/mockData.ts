import { SafetyGuide } from './types';

export const INITIAL_SAFETY_GUIDES: SafetyGuide[] = [
  {
    id: 'guide_fire_01',
    title: 'Domestic & Electrical Fire Evacuation Protocol',
    category: 'fire',
    urgencyLevel: 'CRITICAL',
    summary: 'Immediate action guide for electrical appliance fires, kitchen blazes, and safe residential escape routes.',
    description: 'In the event of a fire outbreak, seconds count. Never use water on electrical or grease fires. Crawl low under smoke to maintain oxygen access and evacuate immediately to designated assembly points.',
    doList: [
      'Disconnect main power circuit breaker if safe to do so without touching live water or metal.',
      'Use a Class ABC dry powder or CO2 fire extinguisher on electrical and fuel fires.',
      'Crawl low under smoke where air is cleaner and cooler.',
      'Test door handles with the back of your hand before opening—if hot, do not open.',
      'Call national emergency fire dispatch (112 or local fire service) once outside.'
    ],
    dontList: [
      'DO NOT throw water on electrical fires or burning cooking oil (grease fires).',
      'DO NOT use elevators during a fire evacuation under any circumstances.',
      'DO NOT re-enter a burning building to retrieve personal belongings or documents.',
      'DO NOT hide in closets or under beds where rescue teams cannot easily spot you.'
    ],
    emergencyContacts: [
      { name: 'State Fire Service Emergency Hotline', phone: '112 / 0800-FIRE-ALERT', roleOrAgency: 'Fire Dispatch Command' },
      { name: 'National Emergency Management Agency', phone: '0800-CALL-NEMA', roleOrAgency: 'Disaster Response' }
    ],
    media: [
      {
        id: 'med_fire_img',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=1200&q=80',
        title: 'Fire Extinguisher PASS Method Diagram',
        caption: 'Pull pin, Aim at base of fire, Squeeze lever, Sweep side-to-side.'
      },
      {
        id: 'med_fire_audio',
        type: 'audio',
        url: 'https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3',
        title: 'Emergency Fire Alarm & Audio Voice Safety Broadcast',
        duration: '0:45'
      }
    ],
    author: {
      uid: 'auth_fire_commander',
      name: 'Assistant Controller General Olatunji',
      role: 'AUTHORITY_DISPATCHER',
      organization: 'State Fire & Rescue Service'
    },
    createdAt: Date.now() - 86400000 * 2,
    isOfficial: true
  },
  {
    id: 'guide_traffic_01',
    title: 'Road Crash First-Response & Highway Incident Protocol',
    category: 'traffic_accident',
    urgencyLevel: 'HIGH',
    summary: 'Standard operating procedures for highway collisions, crash scene protection, and trauma victim assistance.',
    description: 'Highway crashes present secondary risks from oncoming traffic. Secure the crash perimeter first using hazard triangles before attempting victim extraction.',
    doList: [
      'Park your vehicle in a safe spot with hazard lights flashing 50 meters before the crash site.',
      'Place warning triangles or reflective cones upstream of oncoming traffic.',
      'Call FRSC (Federal Road Safety Corps) and ambulance dispatch immediately.',
      'Keep spinal trauma victims stationary unless there is an imminent risk of explosion or fire.'
    ],
    dontList: [
      'DO NOT pull unconscious crash victims forcefully out of vehicles if spinal injury is suspected.',
      'DO NOT crowd the road or block incoming emergency vehicles and ambulances.',
      'DO NOT take photos or videos of victims for social media instead of assisting or calling help.'
    ],
    emergencyContacts: [
      { name: 'Federal Road Safety Corps (FRSC)', phone: '122 / 0700-CALL-FRSC', roleOrAgency: 'Traffic & Highway Patrol' },
      { name: 'National Ambulance Emergency Service', phone: '112 / 0800-MED-RESCUE', roleOrAgency: 'Trauma Response' }
    ],
    media: [
      {
        id: 'med_traffic_img',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        title: 'Highway Crash Scene Perimeter & Warning Triangle Setup',
        caption: 'Secure scene 50m upstream to prevent secondary pile-up collisions.'
      },
      {
        id: 'med_traffic_audio',
        type: 'audio',
        url: 'https://cdn.freesound.org/previews/415/415865_5121236-lq.mp3',
        title: 'FRSC Traffic Safety Advisory Audio Broadcast',
        duration: '1:10'
      }
    ],
    author: {
      uid: 'auth_frsc_marshal',
      name: 'Commander Sarah Danjuma',
      role: 'AUTHORITY_DISPATCHER',
      organization: 'Federal Road Safety Corps (FRSC)'
    },
    createdAt: Date.now() - 86400000 * 3,
    isOfficial: true
  },
  {
    id: 'guide_gas_01',
    title: 'LPG Gas Leakage & Industrial Chemical Hazard Safety',
    category: 'gas_leakage',
    urgencyLevel: 'CRITICAL',
    summary: 'Essential procedures for detecting liquid petroleum gas (LPG) leaks, preventing sparks, and safe ventilation.',
    description: 'Gas leaks present an immediate risk of catastrophic vapor cloud explosions. Any tiny electrical spark—even turning a light switch on or off—can ignite accumulated gas.',
    doList: [
      'Extinguish all open flames, stoves, and cigarettes immediately.',
      'Open all doors and windows wide to promote cross-ventilation and disperse gas heavy vapors.',
      'Shut off the main gas cylinder valve or supply pipeline control knob.',
      'Evacuate all inhabitants outdoors to an upwind location.'
    ],
    dontList: [
      'DO NOT flip any light switches, electrical breakers, or plug in appliances.',
      'DO NOT use mobile phones, flashlights, or electronic devices inside the gas-affected room.',
      'DO NOT use a match or lighter to check where gas is escaping (use soap water solution on joints).'
    ],
    emergencyContacts: [
      { name: 'LPG Safety & Gas Hazard Response', phone: '0800-GAS-LEAK', roleOrAgency: 'Hazardous Materials Control' },
      { name: 'Fire & Rescue Chemical Response Desk', phone: '112', roleOrAgency: 'HAZMAT Team' }
    ],
    media: [
      {
        id: 'med_gas_img',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1200&q=80',
        title: 'LPG Cylinder Safety Regulator & Valve Shut-Off Guide',
        caption: 'Rotate valve clockwise to completely seal gas flow during leaks.'
      },
      {
        id: 'med_gas_audio',
        type: 'audio',
        url: 'https://cdn.freesound.org/previews/456/456100_9159316-lq.mp3',
        title: 'Gas Leak Alarm Advisory & Evacuation Audio Guide',
        duration: '0:55'
      }
    ],
    author: {
      uid: 'auth_hazmat_expert',
      name: 'Engr. Ibrahim Kalu',
      role: 'AUTHORITY_DISPATCHER',
      organization: 'Safety & Industrial Hygiene Bureau'
    },
    createdAt: Date.now() - 86400000 * 4,
    isOfficial: true
  },
  {
    id: 'guide_theft_01',
    title: 'Residential Burglary Defense & Robbery Survival Protocol',
    category: 'theft',
    urgencyLevel: 'HIGH',
    summary: 'De-escalation tactics during armed robbery, home perimeter hardening, and police dispatch reporting.',
    description: 'During an active robbery, personal survival is paramount. Property can be replaced; human lives cannot. Cooperate, maintain non-threatening posture, and observe key suspect descriptors discreetly.',
    doList: [
      'Remain calm and keep hands visible at chest height at all times.',
      'Comply fully with demands without making sudden or erratic movements.',
      'Memorize physical features: height, voice accent, clothing, scars/tattoos, weapon type.',
      'Trigger silent panic button or call police control room as soon as intruders exit safely.'
    ],
    dontList: [
      'DO NOT attempt to tackle armed intruders or play hero against firearms or machetes.',
      'DO NOT make sudden gestures toward pockets or waistbands that could be mistaken for reaching for a weapon.',
      'DO NOT touch crime scene surfaces before police forensic officers document fingerprints.'
    ],
    emergencyContacts: [
      { name: 'Police Emergency Response Command', phone: '0800-POLICE-911', roleOrAgency: 'Police Control Room' },
      { name: 'Community Security Taskforce Desk', phone: '0800-COMM-SEC', roleOrAgency: 'Rapid Vigilance Patrol' }
    ],
    media: [
      {
        id: 'med_theft_img',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
        title: 'Home Security Perimeter & Motion Light Installation',
        caption: 'Well-lit perimeters reduce burglary risks by up to 70%.'
      },
      {
        id: 'med_theft_audio',
        type: 'audio',
        url: 'https://cdn.freesound.org/previews/381/381382_5121236-lq.mp3',
        title: 'Police Burglary Defense Audio Advisory',
        duration: '1:20'
      }
    ],
    author: {
      uid: 'auth_police_supt',
      name: 'Superintendent Grace Okoro',
      role: 'SYSTEM_ADMIN',
      organization: 'State Police Command'
    },
    createdAt: Date.now() - 86400000 * 5,
    isOfficial: true
  },
  {
    id: 'guide_mob_01',
    title: 'Anti-Vigilantism Protocol & Mob Violence De-Escalation',
    category: 'mob_justice',
    urgencyLevel: 'CRITICAL',
    summary: 'Non-confrontational safety guidelines during civil unrest, mob action, and illegal jungle justice attempts.',
    description: 'Antijj operates under strict Anti-Vigilantism principles. Mob justice is illegal, unpredictable, and frequently harms innocent bystanders. Citizens must prioritize non-confrontational shelter and police intervention.',
    doList: [
      'Retreat immediately into a secure indoor building or vehicle away from angry crowds.',
      'Report the incident location and crowd size through Antijj anonymized reporting.',
      'Alert official police emergency dispatch to send anti-riot security personnel.',
      'Encourage fellow community members to allow law enforcement to handle suspects.'
    ],
    dontList: [
      'DO NOT join, follow, or cheer on agitated crowds or mob gatherings.',
      'DO NOT attempt to argue with an agitated mob without armed security backing.',
      'DO NOT distribute unverified rumors or provocative videos that incite community violence.'
    ],
    emergencyContacts: [
      { name: 'Police Anti-Riot & Crowd Control Unit', phone: '0800-ANTI-RIOT', roleOrAgency: 'Special Duty Operations' },
      { name: 'Human Rights Commission Emergency Line', phone: '0800-RIGHTS-HELP', roleOrAgency: 'Protection Command' }
    ],
    media: [
      {
        id: 'med_mob_img',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        title: 'Non-Confrontational UX & Anti-Vigilantism Principles',
        caption: 'Antijj strictly prohibits vigilante coordination and mob action.'
      },
      {
        id: 'med_mob_audio',
        type: 'audio',
        url: 'https://cdn.freesound.org/previews/403/403014_5121236-lq.mp3',
        title: 'Anti-Vigilantism Peace Broadcast & Guidance Audio',
        duration: '1:05'
      }
    ],
    author: {
      uid: 'auth_community_head',
      name: 'Chief Inspector Emeka Nwosu',
      role: 'AUTHORITY_DISPATCHER',
      organization: 'Community Safety Directorate'
    },
    createdAt: Date.now() - 86400000 * 1,
    isOfficial: true
  },
  {
    id: 'guide_vandal_01',
    title: 'Public Infrastructure Protection & Vandalism Reporting',
    category: 'vandalization',
    urgencyLevel: 'MEDIUM',
    summary: 'Guidelines for protecting electrical transformers, telecom cables, water pipelines, and municipal assets.',
    description: 'Infrastructure vandalism directly impacts power supply, clean water distribution, and emergency communications. Protecting public property requires community vigilance and prompt authority reporting.',
    doList: [
      'Report suspicious movements around electrical sub-stations or transformer enclosures late at night.',
      'Note vehicle license plates or equipment used by illegal scrap dealers near public assets.',
      'Keep safe distance from exposed high-voltage cables or damaged gas pipes.',
      'Report vandalized street lights and traffic signals to preserve road safety.'
    ],
    dontList: [
      'DO NOT touch or approach cut high-voltage power lines hanging from poles.',
      'DO NOT confront suspected cable thieves directly without police presence.',
      'DO NOT attempt DIY repairs on municipal electrical transformers or gas mains.'
    ],
    emergencyContacts: [
      { name: 'Infrastructure Defense & Security Taskforce', phone: '0800-PROTECT-ASSET', roleOrAgency: 'Asset Security' },
      { name: 'Electricity Distribution Fault Control', phone: '0800-POWER-HELP', roleOrAgency: 'Power Grid Response' }
    ],
    media: [
      {
        id: 'med_vandal_img',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
        title: 'Sub-Station Security & High Voltage Cable Safety Zone',
        caption: 'Report broken locks or cut fences around electrical transformers immediately.'
      },
      {
        id: 'med_vandal_audio',
        type: 'audio',
        url: 'https://cdn.freesound.org/previews/456/456098_9159316-lq.mp3',
        title: 'Infrastructure Security & Asset Vigilance Broadcast',
        duration: '0:50'
      }
    ],
    author: {
      uid: 'auth_asset_sec',
      name: 'Engr. Blessing Adebayo',
      role: 'AUTHORITY_DISPATCHER',
      organization: 'Public Utilities Protection Agency'
    },
    createdAt: Date.now() - 86400000 * 6,
    isOfficial: true
  }
];
