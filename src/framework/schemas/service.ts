/**
 * Clinic Service Schema
 * Defines the shape of psychological services offered by the clinic.
 */

import type { SchemaDef } from '../data-factory/core/types';

export interface ClinicService {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  price: string;
  color: string;
}

const services = [
  {
    id: 's1',
    title: 'Individual Therapy',
    description: 'One-on-one sessions tailored to your unique needs, addressing anxiety, depression, trauma, and personal growth challenges in a safe, confidential space.',
    icon: 'Brain',
    duration: '50 min',
    price: '150 SAR',
    color: 'teal',
  },
  {
    id: 's2',
    title: 'Cognitive Behavioral Therapy',
    description: 'Evidence-based CBT techniques to identify and change negative thought patterns, helping you develop healthier behaviors and emotional responses.',
    icon: 'Lightbulb',
    duration: '60 min',
    price: '175 SAR',
    color: 'blue',
  },
  {
    id: 's3',
    title: 'Anxiety & Stress Management',
    description: 'Structured programs combining mindfulness, breathing techniques, and cognitive tools to effectively manage anxiety disorders and chronic stress.',
    icon: 'Wind',
    duration: '50 min',
    price: '150 SAR',
    color: 'purple',
  },
  {
    id: 's4',
    title: 'Trauma & EMDR Therapy',
    description: 'Specialized trauma-focused therapy including Eye Movement Desensitization and Reprocessing (EMDR) to heal from past traumatic experiences.',
    icon: 'Shield',
    duration: '90 min',
    price: '225 SAR',
    color: 'rose',
  },
  {
    id: 's5',
    title: 'Couples & Relationship Therapy',
    description: 'Strengthen your relationships through guided sessions that improve communication, resolve conflicts, and rebuild trust and intimacy.',
    icon: 'Heart',
    duration: '75 min',
    price: '200 SAR',
    color: 'pink',
  },
  {
    id: 's6',
    title: 'Child & Adolescent Psychology',
    description: 'Age-appropriate therapeutic support for children and teenagers dealing with behavioral challenges, school anxiety, family changes, and developmental concerns.',
    icon: 'Star',
    duration: '45 min',
    price: '130 SAR',
    color: 'amber',
  },
];

/** RDF Schema definition for ClinicService */
export const serviceSchemaDef: SchemaDef = {
  id:          { generator: (ctx) => services[ctx.index % services.length].id },
  title:       { generator: (ctx) => services[ctx.index % services.length].title },
  description: { generator: (ctx) => services[ctx.index % services.length].description },
  icon:        { generator: (ctx) => services[ctx.index % services.length].icon },
  duration:    { generator: (ctx) => services[ctx.index % services.length].duration },
  price:       { generator: (ctx) => services[ctx.index % services.length].price },
  color:       { generator: (ctx) => services[ctx.index % services.length].color },
};

/** Static services list (used directly, no need for factory generation) */
export const STATIC_SERVICES: ClinicService[] = services;
