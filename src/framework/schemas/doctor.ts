/**
 * Clinic Doctor Schema
 * Defines the shape of doctor mock data using DataFactory.
 */

import type { SchemaDef } from '../data-factory/core/types';

/** TypeScript type for a Doctor entity */
export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialization: string;
  bio: string;
  avatar: string;
  experience: number;
  languages: string[];
  rating: number;
  patientsHelped: number;
  credentials: string[];
}

/** RDF Schema definition for Doctor */
export const doctorSchemaDef: SchemaDef = {
  id:             'uuid',
  name:           { generator: () => 'Dr. Sarah Al-Rashid' },
  title:          { generator: () => 'MD, PhD — Clinical Psychologist' },
  specialization: { generator: () => 'Cognitive Behavioral Therapy & Trauma Recovery' },
  bio: {
    generator: () =>
      'With over 15 years of experience in clinical psychology, Dr. Sarah Al-Rashid has helped hundreds of patients overcome anxiety, depression, trauma, and life transitions. She combines evidence-based CBT with compassionate care to create personalized healing journeys. She is a board-certified psychologist and a member of the Arab Psychological Association.',
  },
  avatar: { generator: () => 'https://i.pravatar.cc/400?u=doctor-sarah' },
  experience: { generator: () => 15 },
  languages: { generator: () => ['Arabic', 'English', 'French'] },
  rating: { generator: () => 4.9 },
  patientsHelped: { generator: () => 850 },
  credentials: {
    generator: () => [
      'PhD Clinical Psychology — Cairo University',
      'CBT Certified — Beck Institute',
      'EMDR Certified Therapist',
      'Member — Arab Psychological Association',
    ],
  },
};
