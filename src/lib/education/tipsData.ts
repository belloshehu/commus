import { EducationalTip } from './types';

export const PRE_SEEDED_TIPS: EducationalTip[] = [
  {
    id: 'tip_safe_reporting',
    title: 'Safe Reporting Guidelines: Protect Yourself While Documenting Incidents',
    category: 'SAFE_REPORTING',
    categoryLabel: 'Safe Reporting',
    summary: 'Essential rules on maintaining distance, preserving anonymity, and submitting early warning reports without exposing your exact location.',
    content: `### Principle 1: Maintain Safe Distance
Never put yourself or others in physical danger to obtain photos, video, or audio evidence. Your personal safety is always the highest priority.

### Principle 2: Location Privacy
Commus automatically applies a 1-3km Geohash fuzzing radius on all public community feeds. Do not include identifiable personal markers or personal phone numbers in public text fields.

### Principle 3: Objective Reporting
Stick strictly to factual observations (what happened, time, danger level). Avoid subjective accusations or naming unverified suspects publicly to prevent mob retaliation.`,
    tags: ['Safety', 'Reporting', 'Privacy', 'Geohash'],
    author: 'Commus Safety Advisory Board',
    estimatedReadMinutes: 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    isPublished: true,
  },
  {
    id: 'tip_personal_safety',
    title: 'Personal Safety Protocol During Active Community Hazards',
    category: 'PERSONAL_SAFETY',
    categoryLabel: 'Personal Safety',
    summary: 'Immediate action steps to take when a High-Risk or Critical danger alert is issued in your local safety zone.',
    content: `### Step 1: Secure Your Surroundings
If an active disturbance or riot alert is triggered nearby, immediately move indoors, lock entryways, and notify family members in the area.

### Step 2: Avoid Gathering Points
Do not travel towards crowd bottlenecks, active protest lines, or unverified conflict zones out of curiosity.

### Step 3: Monitor Official Updates
Use the Commus Community Feed and verified emergency authority hotlines (such as 112) for official escalation responses rather than unverified social media rumors.`,
    tags: ['Personal Safety', 'Alerts', 'Emergency', 'Defense'],
    author: 'National Emergency Advisory Unit',
    estimatedReadMinutes: 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    isPublished: true,
  },
  {
    id: 'tip_deescalation',
    title: 'De-escalation Techniques: Calming Tensions Before Violence Erupts',
    category: 'DE_ESCALATION',
    categoryLabel: 'De-escalation',
    summary: 'Practical verbal strategies and behavioral guidelines to defuse heated community disputes before physical escalation occurs.',
    content: `### 1. Maintain Calm Body Language
Keep your hands visible, keep your voice steady, and avoid aggressive hand gestures or invading personal space.

### 2. Active Listening & Acknowledgment
Acknowledge grievances without escalating blame. Calmly state: "We understand everyone is concerned. Let us resolve this peacefully without violence."

### 3. Involve Neutral Community Elders
Call upon respected community leaders, civil defense officers, or religious leaders who can mediate heated confrontations safely.`,
    tags: ['De-escalation', 'Conflict Resolution', 'Community Peace'],
    author: 'Civil Protection & Mediation Network',
    estimatedReadMinutes: 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    isPublished: true,
  },
  {
    id: 'tip_inviting_members',
    title: 'Building Trusted Networks: How to Invite Verified Community Members',
    category: 'INVITING_MEMBERS',
    categoryLabel: 'Inviting Members',
    summary: 'Guide on expanding your neighborhood early-warning circle with verified, law-abiding community members.',
    content: `### 1. Use 1-Click QR Code & Invitation Links
Share your official community invitation link or QR code directly with trusted neighbors, resident association members, and business owners.

### 2. Verify Member Identities
Ensure invited members belong to your geographic area or transit corridor to maintain high alert accuracy and prevent spam accounts.

### 3. Earn the Community Builder Badge
Inviting verified members who actively participate in community safety campaigns earns you credit towards the specialized Community Builder badge.`,
    tags: ['Community', 'Invitations', 'Network', 'Onboarding'],
    author: 'Commus Community Growth Team',
    estimatedReadMinutes: 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    isPublished: true,
  },
  {
    id: 'tip_community_participation',
    title: 'Active Community Safety Participation & Responsible Engagement',
    category: 'COMMUNITY_PARTICIPATION',
    categoryLabel: 'Community Participation',
    summary: 'How everyday citizens contribute to early warning networks without becoming vigilantes or taking the law into their own hands.',
    content: `### Non-Vigilantism Principle
Commus strictly prohibits mob action, public witch-hunts, or extrajudicial punishment. Community safety relies on rapid detection, transparent documentation, and official authority intervention.

### How Citizens Participate Effectively:
- Verify early warning alerts posted by neighbors.
- Participate in organized safety awareness campaigns.
- Share emergency hotline information (112, Police, Fire Service, NEMA).`,
    tags: ['Participation', 'Citizenship', 'Safety Culture'],
    author: 'Commus Ethics & Governance Panel',
    estimatedReadMinutes: 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    isPublished: true,
  },
  {
    id: 'tip_campaign_organization',
    title: 'Organizing Impactful Educational Campaigns in Your Neighborhood',
    category: 'CAMPAIGN_ORGANIZATION',
    categoryLabel: 'Campaign Organization',
    summary: 'A step-by-step roadmap for community leaders to launch, manage, and complete anti-jungle justice awareness campaigns.',
    content: `### Step 1: Define Clear Objectives
Set realistic goals such as "Educating 200 residents on calling 112 during theft incidents instead of resorting to mob violence."

### Step 2: Schedule & Launch
Create the campaign in the Commus Campaigns portal specifying start/end dates, target metrics, and detailed descriptions.

### Step 3: Track Metrics & Earn Badges
Monitor live participant numbers and completed verified actions. Successfully completing a campaign awards the Campaign Leader badge.`,
    tags: ['Campaigns', 'Leadership', 'Organization', 'Metrics'],
    author: 'Commus Engagement Directorate',
    estimatedReadMinutes: 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    isPublished: true,
  },
  {
    id: 'tip_preventing_jungle_justice',
    title: 'The Urgent Necessity of Preventing Jungle Justice & Extrajudicial Mob Action',
    category: 'PREVENTING_JUNGLE_JUSTICE',
    categoryLabel: 'Preventing Jungle Justice',
    summary: 'Why mob violence undermines social stability, destroys innocent lives, and destroys community trust.',
    content: `### The Tragedy of Mistaken Identity
Studies show that over 40% of jungle justice victims are completely innocent individuals targeted due to false accusations, misunderstandings, or personal vendettas.

### Judicial Due Process Protects Everyone
When a suspect is apprehended by citizens, they MUST immediately be handed over to the Nigeria Police Force or NSCDC. Extrajudicial killing or torture is murder under national law.

### Commus's Stance
Mob violence is NEVER justified. Early warning alerts exist to summon legal authorities, not to assemble violent crowds.`,
    tags: ['Human Rights', 'Anti-Jungle Justice', 'Justice', 'Law'],
    author: 'Center for Human Rights & Rule of Law',
    estimatedReadMinutes: 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    isPublished: true,
  },
  {
    id: 'tip_jungle_justice_consequences',
    title: 'Legal, Moral, and Criminal Consequences of Jungle Justice',
    category: 'JUNGLE_JUSTICE_CONSEQUENCES',
    categoryLabel: 'Consequences of Jungle Justice',
    summary: 'Detailed explanation of criminal liability, murder charges, imprisonment penalties, and societal fallout of mob violence.',
    content: `### 1. Capital Criminal Charges
Participating in, inciting, or standing by to record mob killings without intervening or calling police carries severe murder and manslaughter charges punishable by life imprisonment or death.

### 2. Digital Evidence & Prosecution
Modern law enforcement agencies use forensic video evidence, digital audit logs, and facial recognition to prosecute all participants in mob violence years after the event.

### 3. Societal Breakdown
Communities tolerant of jungle justice experience higher crime rates, economic decay, and fear, as no citizen remains safe from arbitrary mob accusations.`,
    tags: ['Legal Penalties', 'Criminal Law', 'Prosecution', 'Consequences'],
    author: 'Legal Aid & Constitutional Rights Group',
    estimatedReadMinutes: 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    isPublished: true,
  },
];
