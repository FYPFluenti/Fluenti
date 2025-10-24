import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export class OpenAIAssessmentService {
  
  /**
   * Analyze a specific category (hearing, pragmatics, play, etc.) using OpenAI
   */
  static async analyzeCategoryWithAI(
    categoryName: string,
    responses: Array<{ question: string; answer: 'yes' | 'no' | 'cant-tell' }>,
    childAge: { years: number; months: number },
    childName?: string
  ): Promise<AIAssessmentAnalysis> {
    
    const ageInMonths = childAge.years * 12 + childAge.months;
    const childNameStr = childName || 'the child';
    
    const prompt = `You are a pediatric speech-language pathologist and child development expert. Analyze the following assessment responses for ${childNameStr} who is ${childAge.years} years and ${childAge.months} months old.

CATEGORY: ${categoryName.toUpperCase()}

ASSESSMENT RESPONSES:
${responses.map((r, index) => `${index + 1}. Question: "${r.question}"
   Answer: ${r.answer}`).join('\n\n')}

CHILD'S AGE: ${childAge.years} years, ${childAge.months} months (${ageInMonths} months total)

Please analyze these responses based on evidence-based child development milestones and provide:

1. RISK LEVEL: Classify as "low", "moderate", or "high" based on developmental expectations
2. CONCERNING ANSWERS: Count how many responses indicate potential developmental concerns
3. MILESTONE ALIGNMENT: Percentage (0-100) of how well the child meets expected milestones for their age
4. RECOMMENDATIONS: Specific, actionable recommendations (3-5 items)
5. REASONING: Brief explanation of your analysis

Consider these factors:
- Age-appropriate expectations for ${categoryName.toLowerCase()} development
- The severity and combination of concerning responses
- Developmental milestones typically achieved by ${ageInMonths} months
- Evidence-based intervention strategies

Respond in JSON format:
{
  "categoryName": "${categoryName}",
  "riskLevel": "low|moderate|high",
  "concerningAnswers": number,
  "recommendations": ["recommendation1", "recommendation2", ...],
  "milestoneAlignment": percentage_number,
  "reasoning": "your_analysis_explanation"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert pediatric speech-language pathologist with extensive knowledge of child development milestones. Provide accurate, evidence-based assessments in the requested JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent clinical assessments
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const analysis = JSON.parse(response) as AIAssessmentAnalysis;
      
      // Validate the response structure
      if (!analysis.riskLevel || !analysis.recommendations || typeof analysis.milestoneAlignment !== 'number') {
        throw new Error('Invalid response structure from OpenAI');
      }

      return analysis;

    } catch (error) {
      console.error(`Error analyzing ${categoryName} with OpenAI:`, error);
      throw new Error(`Failed to analyze ${categoryName} category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate overall assessment summary using OpenAI
   */
  static async generateOverallAssessment(
    categoryAnalyses: AIAssessmentAnalysis[],
    childAge: { years: number; months: number },
    childName?: string,
    totalQuestions?: number
  ): Promise<AIOverallAssessment> {
    
    const childNameStr = childName || 'the child';
    const ageInMonths = childAge.years * 12 + childAge.months;
    
    const prompt = `You are a pediatric speech-language pathologist providing an overall assessment summary for ${childNameStr} who is ${childAge.years} years and ${childAge.months} months old.

INDIVIDUAL CATEGORY ANALYSES:
${categoryAnalyses.map(analysis => `
CATEGORY: ${analysis.categoryName}
Risk Level: ${analysis.riskLevel}
Concerning Answers: ${analysis.concerningAnswers}
Milestone Alignment: ${analysis.milestoneAlignment}%
Recommendations: ${analysis.recommendations.join(', ')}
Reasoning: ${analysis.reasoning}
`).join('\n')}

CHILD'S AGE: ${childAge.years} years, ${childAge.months} months (${ageInMonths} months total)
TOTAL ASSESSMENT QUESTIONS: ${totalQuestions || 'Not specified'}

Based on the individual category analyses above, provide:

1. OVERALL RISK LEVEL: Determine the overall developmental risk level ("low", "moderate", or "high")
2. SUMMARY: Write a comprehensive but parent-friendly summary (2-3 sentences) explaining the child's developmental status
3. NEXT STEPS: Provide 3-5 prioritized next steps for parents/caregivers
4. REASONING: Explain how you determined the overall risk level

Consider:
- The combination and severity of individual category risks
- Age-appropriate developmental expectations
- Priority areas that need immediate attention
- Supportive and encouraging tone while being clinically accurate

Respond in JSON format:
{
  "overallRiskLevel": "low|moderate|high",
  "summary": "comprehensive_summary_text",
  "nextSteps": ["step1", "step2", "step3", ...],
  "reasoning": "explanation_of_overall_assessment"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert pediatric speech-language pathologist providing family-centered care. Your assessments should be accurate, supportive, and actionable for parents and caregivers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const assessment = JSON.parse(response) as AIOverallAssessment;
      
      // Validate response structure
      if (!assessment.overallRiskLevel || !assessment.summary || !assessment.nextSteps) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return assessment;

    } catch (error) {
      console.error('Error generating overall assessment with OpenAI:', error);
      throw new Error(`Failed to generate overall assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if OpenAI API is available and configured
   */
  static isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}