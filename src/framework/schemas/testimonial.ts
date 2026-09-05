/**
 * Testimonial Schema
 * Defines mock patient testimonials for the clinic.
 */

import type { SchemaDef } from '../data-factory/core/types';

export interface Testimonial {
  id: string;
  patientName: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  sessionType: string;
}

const testimonials = [
  {
    patientName: 'Layla M.',
    text: 'Dr. Sarah changed my life. After years of struggling with anxiety, I finally have the tools to manage my thoughts and live fully. Her CBT approach is structured yet compassionate.',
    sessionType: 'Anxiety Management',
    rating: 5,
  },
  {
    patientName: 'Ahmed K.',
    text: 'I was skeptical about therapy at first, but the welcoming environment and Dr. Sarah\'s professionalism made all the difference. My depression has improved significantly in just 3 months.',
    sessionType: 'Individual Therapy',
    rating: 5,
  },
  {
    patientName: 'Nour & Tariq',
    text: 'Couples therapy with Dr. Sarah helped us communicate again after years of conflict. We learned skills that we still use daily. Highly recommend to any couple facing challenges.',
    sessionType: 'Couples Therapy',
    rating: 5,
  },
  {
    patientName: 'Rania H.',
    text: 'The EMDR sessions for my childhood trauma were truly healing. I never thought I could feel this free from the past. Dr. Sarah is patient, professional, and deeply empathetic.',
    sessionType: 'Trauma & EMDR',
    rating: 5,
  },
  {
    patientName: 'Omar S.',
    text: 'The work stress was overwhelming. After 8 sessions, I now have clear strategies for managing pressure and setting healthy boundaries. My productivity and happiness have both improved.',
    sessionType: 'Stress Management',
    rating: 5,
  },
  {
    patientName: 'Fatima A.',
    text: 'My 12-year-old son was struggling with school anxiety. Dr. Sarah connected with him immediately and helped him build confidence. We are so grateful for her work with our family.',
    sessionType: 'Child Psychology',
    rating: 5,
  },
];

export const testimonialSchemaDef: SchemaDef = {
  id:          { generator: (ctx) => `t${ctx.index + 1}` },
  patientName: { generator: (ctx) => testimonials[ctx.index % testimonials.length].patientName },
  avatar:      { generator: (ctx) => `https://i.pravatar.cc/80?u=patient-${ctx.index}` },
  rating:      { generator: (ctx) => testimonials[ctx.index % testimonials.length].rating },
  text:        { generator: (ctx) => testimonials[ctx.index % testimonials.length].text },
  sessionType: { generator: (ctx) => testimonials[ctx.index % testimonials.length].sessionType },
  date: {
    generator: (ctx) => {
      const dates = ['2 weeks ago', '1 month ago', '3 months ago', '2 months ago', '5 months ago', '1 week ago'];
      return dates[ctx.index % dates.length];
    },
  },
};
