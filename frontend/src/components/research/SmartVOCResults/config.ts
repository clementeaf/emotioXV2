import { MockData } from './types';

interface MetricConfig {
  key: string;
  title: string;
  question: string;
  getData: (data: MockData) => {
    score: number;
    data: Array<{
      date: string;
      satisfied: number;
      dissatisfied: number;
    }>;
  };
}

export const metrics: MetricConfig[] = [
  {
    key: 'csat',
    title: 'Customer Satisfaction',
    question: 'How are feeling your customers when they interact with you?',
    getData: (data) => ({
      score: data.csat.score,
      data: data.csat.data
    })
  },
  {
    key: 'ces',
    title: 'Customer Effort Score',
    question: 'How much effort do they need to do to complete a task?',
    getData: (data) => ({
      score: data.ces.score,
      data: data.ces.data
    })
  },
  {
    key: 'cv',
    title: 'Cognitive Value',
    question: 'Is there value in your solution ove the memory of customers?',
    getData: (data) => ({
      score: data.cv.score,
      data: data.cv.data
    })
  }
];
