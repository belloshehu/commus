import { IncidentCategory } from '@/lib/firebase/rtdb';
import { getCategoryConfig } from '@/lib/incidentCategoryHelper';

export interface VoiceClassificationResult {
  category: IncidentCategory;
  suggestedTitle: string;
  transcriptDescription: string;
  confidenceScore: number;
}

interface CategoryKeywordMap {
  category: IncidentCategory;
  keywords: string[];
}

const CATEGORY_KEYWORDS: CategoryKeywordMap[] = [
  {
    category: 'TRAFFIC_HAZARD',
    keywords: [
      'traffic',
      'accident',
      'crash',
      'car',
      'vehicle',
      'roadblock',
      'debris',
      'highway',
      'jam',
      'lane',
      'collision',
      'truck',
    ],
  },
  {
    category: 'INFRASTRUCTURE_FAILURE',
    keywords: [
      'power',
      'blackout',
      'outage',
      'electricity',
      'water',
      'pipe',
      'burst',
      'flood',
      'bridge',
      'collapse',
      'streetlight',
      'wire',
      'gas',
      'leak',
    ],
  },
  {
    category: 'CROWD_SAFETY_ALERT',
    keywords: [
      'crowd',
      'stampede',
      'gathering',
      'protest',
      'bottleneck',
      'surge',
      'crush',
      'stadium',
      'uncontrolled',
      'rally',
      'people',
    ],
  },
  {
    category: 'DISTURBANCE',
    keywords: [
      'fight',
      'brawl',
      'noise',
      'commotion',
      'shouting',
      'unrest',
      'riot',
      'dispute',
      'argument',
      'violence',
      'altercation',
    ],
  },
  {
    category: 'EMERGENCY_OTHER',
    keywords: [
      'fire',
      'smoke',
      'hazard',
      'danger',
      'emergency',
      'help',
      'medical',
      'collapse',
      'alert',
    ],
  },
];

/**
 * Intelligent voice transcript classifier.
 * Analyzes natural language spoken text to determine incident category,
 * auto-generate concise title summary, and clean up transcript.
 */
export function classifyVoiceTranscript(transcript: string): VoiceClassificationResult {
  const cleanTranscript = (transcript || '').trim();
  if (!cleanTranscript) {
    return {
      category: 'EMERGENCY_OTHER',
      suggestedTitle: 'Voice Incident Report',
      transcriptDescription: 'Voice recording submitted by community member.',
      confidenceScore: 0.1,
    };
  }

  const lowerText = cleanTranscript.toLowerCase();

  // 1. Calculate keyword match scores for each category
  const scores: Record<IncidentCategory, number> = {
    CROWD_SAFETY_ALERT: 0,
    TRAFFIC_HAZARD: 0,
    INFRASTRUCTURE_FAILURE: 0,
    DISTURBANCE: 0,
    EMERGENCY_OTHER: 0,
  };

  for (const item of CATEGORY_KEYWORDS) {
    for (const keyword of item.keywords) {
      if (lowerText.includes(keyword)) {
        scores[item.category] += 1;
      }
    }
  }

  // 2. Select category with highest score
  let bestCategory: IncidentCategory = 'EMERGENCY_OTHER';
  let maxScore = 0;

  (Object.keys(scores) as IncidentCategory[]).forEach((cat) => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      bestCategory = cat;
    }
  });

  // 3. Generate suggested title summary from transcript
  const config = getCategoryConfig(bestCategory);
  const sentences = cleanTranscript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  let firstSentence = sentences[0] || cleanTranscript;
  
  if (firstSentence.length > 50) {
    firstSentence = firstSentence.substring(0, 47) + '...';
  }

  // Capitalize first letter
  const formattedFirstSentence = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  const suggestedTitle = `${config.label}: ${formattedFirstSentence}`;

  const confidenceScore = maxScore > 0 ? Math.min(1.0, 0.4 + maxScore * 0.2) : 0.3;

  return {
    category: bestCategory,
    suggestedTitle,
    transcriptDescription: cleanTranscript,
    confidenceScore,
  };
}
