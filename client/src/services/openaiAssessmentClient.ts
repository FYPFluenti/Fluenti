// Client-side service to interact with OpenAI assessment API

export interface AssessmentResponse {
  question: string;
  answer: 'yes' | 'no' | 'cant-tell';
}

export interface AIAssessmentAnalysis {
  categoryName: string;
  riskLevel: 'low' | 'moderate' | 'high';
  concerningAnswers: number;
  recommendations: string[];
  milestoneAlignment: number;
  reasoning: string;
}

export interface AIOverallAssessment {
  overallRiskLevel: 'low' | 'moderate' | 'high';
  summary: string;
  nextSteps: string[];
  reasoning: string;
}

export class OpenAIAssessmentClient {
  private static readonly API_BASE = '/api';

  /**
   * Analyze a specific category using OpenAItell
   */
  static async analyzeCategory(
    categoryName: string,
    responses: AssessmentResponse[],
    childAge: { years: number; months: number },
    childName?: string
  ): Promise<AIAssessmentAnalysis> {
    try {
      const response = await fetch(`${this.API_BASE}/assessment/analyze-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName,
          responses,
          childAge,
          childName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error(`Error analyzing ${categoryName} category:`, error);
      throw error;
    }
  }

  /**
   * Generate overall assessment using OpenAI
   */
  static async generateOverallAssessment(
    categoryAnalyses: AIAssessmentAnalysis[],
    childAge: { years: number; months: number },
    childName?: string,
    totalQuestions?: number
  ): Promise<AIOverallAssessment> {
    try {
      const response = await fetch(`${this.API_BASE}/assessment/overall-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryAnalyses,
          childAge,
          childName,
          totalQuestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.assessment;
    } catch (error) {
      console.error('Error generating overall assessment:', error);
      throw error;
    }
  }

  /**
   * Check if OpenAI assessment service is available
   */
  static async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/assessment/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking assessment service availability:', error);
      return false;
    }
  }
}