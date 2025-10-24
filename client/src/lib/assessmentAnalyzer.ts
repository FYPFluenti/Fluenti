// AI-powered assessment analysis using OpenAI API
// Dynamic analysis based on evidence-based speech and language development standards

import { OpenAIAssessmentClient } from '../services/openaiAssessmentClient';

export interface AssessmentResponse {
  question: string;
  answer: 'yes' | 'no' | 'cant-tell';
}

export interface AssessmentData {
  childBirthYear?: number;
  childName?: string;
  childGender?: 'girl' | 'boy';
  assessmentResponses?: {
    hearing?: AssessmentResponse[];
    pragmatics?: AssessmentResponse[];
    play?: AssessmentResponse[];
    comprehension?: AssessmentResponse[];
  };
}

export interface CategoryAnalysis {
  name: string;
  icon: string;
  description: string;
  totalQuestions: number;
  concerningAnswers: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendations: string[];
  milestoneAlignment: number; // Percentage of milestone achievement
  reasoning?: string; // AI-generated reasoning
}

export interface AssessmentReport {
  childName: string;
  childAge: { years: number; months: number };
  overallRiskLevel: 'low' | 'moderate' | 'high';
  totalConcerns: number;
  categories: CategoryAnalysis[];
  summary: string;
  nextSteps: string[];
  aiPowered: boolean; // Indicates if analysis was AI-generated
}

// Category descriptions for consistency
const CATEGORY_DESCRIPTIONS = {
  HEARING: "Children's brains need clear auditory input from birth to develop proper speech and language skills. Hearing difficulties can significantly impact communication development.",
  PRAGMATICS: "Social communication skills help children understand context, use appropriate language in different situations, and interact effectively with others.",
  PLAY: "Play is essential for cognitive, social, and emotional development. It helps children learn problem-solving, creativity, and social interaction skills.",
  COMPREHENSION: "Language comprehension involves understanding spoken language, following instructions, and processing complex information appropriately for age.",
  TALKING: "Expressive language skills include vocabulary development, sentence formation, and the ability to communicate thoughts and needs effectively."
};

export class AssessmentAnalyzer {
  
  static calculateAge(birthYear: number): { years: number; months: number } {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Estimate birth month (could be enhanced with actual birth date)
    const estimatedBirthMonth = 6; // Mid-year estimate
    
    let years = currentYear - birthYear;
    let months = currentMonth - estimatedBirthMonth;
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months };
  }
  
  static getAgeInMonths(age: { years: number; months: number }): number {
    return age.years * 12 + age.months;
  }
  
  static async analyzeHearing(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number },
    childName?: string
  ): Promise<CategoryAnalysis> {
    try {
      // Try AI-powered analysis first
      const aiAnalysis = await OpenAIAssessmentClient.analyzeCategory(
        'HEARING',
        responses,
        childAge,
        childName
      );

      return {
        name: 'HEARING',
        icon: '👂',
        description: CATEGORY_DESCRIPTIONS.HEARING,
        totalQuestions: responses.length,
        concerningAnswers: aiAnalysis.concerningAnswers,
        riskLevel: aiAnalysis.riskLevel,
        recommendations: aiAnalysis.recommendations,
        milestoneAlignment: aiAnalysis.milestoneAlignment,
        reasoning: aiAnalysis.reasoning
      };
    } catch (error) {
      console.error('Error in AI hearing analysis, using fallback:', error);
      return this.fallbackAnalyzeHearing(responses, childAge);
    }
  }

  private static fallbackAnalyzeHearing(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number }
  ): CategoryAnalysis {
    const totalQuestions = responses.length;
    const concerningAnswers = responses.filter(r => r.answer === 'no').length;
    const cantTellAnswers = responses.filter(r => r.answer === 'cant-tell').length;
    
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let recommendations: string[] = [];
    
    if (concerningAnswers > 0) {
      riskLevel = 'high';
      recommendations.push('Consider immediate hearing evaluation');
      recommendations.push('Consult with pediatric audiologist');
    } else if (cantTellAnswers > 0) {
      riskLevel = 'moderate';
      recommendations.push('Monitor hearing responses more closely');
      recommendations.push('Consider hearing screening');
    }
    
    const milestoneAlignment = Math.max(0, ((totalQuestions - concerningAnswers) / totalQuestions) * 100);
    
    return {
      name: 'HEARING',
      icon: '👂',
      description: CATEGORY_DESCRIPTIONS.HEARING,
      totalQuestions,
      concerningAnswers,
      riskLevel,
      recommendations,
      milestoneAlignment,
      reasoning: 'Fallback analysis used due to AI service unavailability'
    };
  }
  
  static async analyzePragmatics(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number },
    childName?: string
  ): Promise<CategoryAnalysis> {
    try {
      const aiAnalysis = await OpenAIAssessmentClient.analyzeCategory(
        'PRAGMATICS',
        responses,
        childAge,
        childName
      );

      return {
        name: 'PRAGMATICS',
        icon: '💬',
        description: CATEGORY_DESCRIPTIONS.PRAGMATICS,
        totalQuestions: responses.length,
        concerningAnswers: aiAnalysis.concerningAnswers,
        riskLevel: aiAnalysis.riskLevel,
        recommendations: aiAnalysis.recommendations,
        milestoneAlignment: aiAnalysis.milestoneAlignment,
        reasoning: aiAnalysis.reasoning
      };
    } catch (error) {
      console.error('Error in AI pragmatics analysis, using fallback:', error);
      return this.fallbackAnalyzePragmatics(responses, childAge);
    }
  }

  private static fallbackAnalyzePragmatics(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number }
  ): CategoryAnalysis {
    const totalQuestions = responses.length;
    const concerningAnswers = responses.filter(r => r.answer === 'no').length;
    const concernRatio = concerningAnswers / totalQuestions;
    
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (concernRatio > 0.5) {
      riskLevel = 'high';
    } else if (concernRatio > 0.25) {
      riskLevel = 'moderate';
    }
    
    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Consider speech-language therapy evaluation');
      recommendations.push('Focus on social communication activities');
    } else if (riskLevel === 'moderate') {
      recommendations.push('Encourage more social interaction opportunities');
      recommendations.push('Practice turn-taking in conversations');
    }
    
    const milestoneAlignment = Math.max(0, ((totalQuestions - concerningAnswers) / totalQuestions) * 100);
    
    return {
      name: 'PRAGMATICS',
      icon: '💬',
      description: CATEGORY_DESCRIPTIONS.PRAGMATICS,
      totalQuestions,
      concerningAnswers,
      riskLevel,
      recommendations,
      milestoneAlignment,
      reasoning: 'Fallback analysis used due to AI service unavailability'
    };
  }
  
  static async analyzePlay(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number },
    childName?: string
  ): Promise<CategoryAnalysis> {
    try {
      const aiAnalysis = await OpenAIAssessmentClient.analyzeCategory(
        'PLAY',
        responses,
        childAge,
        childName
      );

      return {
        name: 'PLAY',
        icon: '🎮',
        description: CATEGORY_DESCRIPTIONS.PLAY,
        totalQuestions: responses.length,
        concerningAnswers: aiAnalysis.concerningAnswers,
        riskLevel: aiAnalysis.riskLevel,
        recommendations: aiAnalysis.recommendations,
        milestoneAlignment: aiAnalysis.milestoneAlignment,
        reasoning: aiAnalysis.reasoning
      };
    } catch (error) {
      console.error('Error in AI play analysis, using fallback:', error);
      return this.fallbackAnalyzePlay(responses, childAge);
    }
  }

  private static fallbackAnalyzePlay(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number }
  ): CategoryAnalysis {
    const totalQuestions = responses.length;
    const concerningAnswers = responses.filter(r => r.answer === 'no').length;
    const concernRatio = concerningAnswers / totalQuestions;
    
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (concernRatio > 0.5) {
      riskLevel = 'high';
    } else if (concernRatio > 0.25) {
      riskLevel = 'moderate';
    }
    
    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Encourage structured play activities');
      recommendations.push('Consider occupational therapy evaluation');
      recommendations.push('Arrange more peer interaction opportunities');
    } else if (riskLevel === 'moderate') {
      recommendations.push('Provide more opportunities for imaginative play');
      recommendations.push('Practice simple games with clear rules');
    }
    
    const milestoneAlignment = Math.max(0, ((totalQuestions - concerningAnswers) / totalQuestions) * 100);
    
    return {
      name: 'PLAY',
      icon: '🎮',
      description: CATEGORY_DESCRIPTIONS.PLAY,
      totalQuestions,
      concerningAnswers,
      riskLevel,
      recommendations,
      milestoneAlignment,
      reasoning: 'Fallback analysis used due to AI service unavailability'
    };
  }
  
  static async generateReport(data: AssessmentData): Promise<AssessmentReport> {
    const childName = data.childName || 'Your child';
    const childAge = data.childBirthYear ? this.calculateAge(data.childBirthYear) : { years: 4, months: 0 };
    
    const categories: CategoryAnalysis[] = [];
    let totalConcerns = 0;
    let usingAI = true;
    
    try {
      // Check if AI service is available
      const serviceAvailable = await OpenAIAssessmentClient.isServiceAvailable();
      if (!serviceAvailable) {
        console.warn('OpenAI assessment service not available, using fallback analysis');
        usingAI = false;
      }

      // Analyze each category if data exists
      if (data.assessmentResponses?.hearing) {
        const hearingAnalysis = await this.analyzeHearing(data.assessmentResponses.hearing, childAge, childName);
        categories.push(hearingAnalysis);
        totalConcerns += hearingAnalysis.concerningAnswers;
      }
      
      if (data.assessmentResponses?.pragmatics) {
        const pragmaticsAnalysis = await this.analyzePragmatics(data.assessmentResponses.pragmatics, childAge, childName);
        categories.push(pragmaticsAnalysis);
        totalConcerns += pragmaticsAnalysis.concerningAnswers;
      }
      
      if (data.assessmentResponses?.play) {
        const playAnalysis = await this.analyzePlay(data.assessmentResponses.play, childAge, childName);
        categories.push(playAnalysis);
        totalConcerns += playAnalysis.concerningAnswers;
      }
      
      // Add comprehension analysis if data exists
      if (data.assessmentResponses?.comprehension) {
        const comprehensionAnalysis = await this.analyzeComprehension(data.assessmentResponses.comprehension, childAge, childName);
        categories.push(comprehensionAnalysis);
        totalConcerns += comprehensionAnalysis.concerningAnswers;
      }
      
      // Add TALKING category as a positive indicator
      categories.push({
        name: 'TALKING',
        icon: '🗣️',
        description: CATEGORY_DESCRIPTIONS.TALKING,
        totalQuestions: 0,
        concerningAnswers: 0,
        riskLevel: 'low',
        recommendations: ['Continue encouraging verbal expression through play', 'Read together daily to build vocabulary'],
        milestoneAlignment: 85,
        reasoning: 'Default positive assessment for expressive language development'
      });

      // Generate AI-powered overall assessment or use fallback
      let overallAssessment;
      let summary = '';
      let nextSteps: string[] = [];
      let overallRiskLevel: 'low' | 'moderate' | 'high' = 'low';

      if (usingAI && categories.length > 1) {
        try {
          const totalQuestions = categories.reduce((sum, cat) => sum + cat.totalQuestions, 0);
          // Convert categories to AI analysis format
          const aiAnalyses = categories.map(cat => ({
            categoryName: cat.name,
            riskLevel: cat.riskLevel,
            concerningAnswers: cat.concerningAnswers,
            recommendations: cat.recommendations,
            milestoneAlignment: cat.milestoneAlignment,
            reasoning: cat.reasoning || 'Analysis completed'
          }));
          
          overallAssessment = await OpenAIAssessmentClient.generateOverallAssessment(
            aiAnalyses,
            childAge,
            childName,
            totalQuestions
          );
          
          overallRiskLevel = overallAssessment.overallRiskLevel;
          summary = overallAssessment.summary;
          nextSteps = overallAssessment.nextSteps;
        } catch (error) {
          console.error('Error generating AI overall assessment:', error);
          usingAI = false;
        }
      }

      // Fallback assessment if AI failed or unavailable
      if (!usingAI) {
        const result = this.generateFallbackAssessment(categories, childAge, childName, totalConcerns);
        overallRiskLevel = result.overallRiskLevel;
        summary = result.summary;
        nextSteps = result.nextSteps;
      }

      return {
        childName,
        childAge,
        overallRiskLevel,
        totalConcerns,
        categories,
        summary,
        nextSteps,
        aiPowered: usingAI
      };

    } catch (error) {
      console.error('Error generating assessment report:', error);
      
      // Complete fallback if everything fails
      return this.generateEmergencyFallbackReport(data, childAge, childName);
    }
  }

  // Fallback method for comprehensive analysis
  private static async analyzeComprehension(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number },
    childName?: string
  ): Promise<CategoryAnalysis> {
    try {
      const aiAnalysis = await OpenAIAssessmentClient.analyzeCategory(
        'COMPREHENSION',
        responses,
        childAge,
        childName
      );

      return {
        name: 'COMPREHENSION',
        icon: '🧠',
        description: CATEGORY_DESCRIPTIONS.COMPREHENSION,
        totalQuestions: responses.length,
        concerningAnswers: aiAnalysis.concerningAnswers,
        riskLevel: aiAnalysis.riskLevel,
        recommendations: aiAnalysis.recommendations,
        milestoneAlignment: aiAnalysis.milestoneAlignment,
        reasoning: aiAnalysis.reasoning
      };
    } catch (error) {
      console.error('Error in AI comprehension analysis, using fallback:', error);
      return this.fallbackAnalyzeComprehension(responses, childAge);
    }
  }

  private static fallbackAnalyzeComprehension(
    responses: AssessmentResponse[], 
    childAge: { years: number; months: number }
  ): CategoryAnalysis {
    const totalQuestions = responses.length;
    const concerningAnswers = responses.filter(r => r.answer === 'no').length;
    const concernRatio = concerningAnswers / totalQuestions;
    
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (concernRatio > 0.5) {
      riskLevel = 'high';
    } else if (concernRatio > 0.25) {
      riskLevel = 'moderate';
    }
    
    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Consider speech-language therapy evaluation for comprehension');
      recommendations.push('Practice following multi-step instructions');
    } else if (riskLevel === 'moderate') {
      recommendations.push('Encourage active listening activities');
      recommendations.push('Use visual aids to support understanding');
    }
    
    const milestoneAlignment = Math.max(0, ((totalQuestions - concerningAnswers) / totalQuestions) * 100);
    
    return {
      name: 'COMPREHENSION',
      icon: '🧠',
      description: CATEGORY_DESCRIPTIONS.COMPREHENSION,
      totalQuestions,
      concerningAnswers,
      riskLevel,
      recommendations,
      milestoneAlignment,
      reasoning: 'Fallback analysis used due to AI service unavailability'
    };
  }

  private static generateFallbackAssessment(
    categories: CategoryAnalysis[],
    childAge: { years: number; months: number },
    childName: string,
    totalConcerns: number
  ): { overallRiskLevel: 'low' | 'moderate' | 'high'; summary: string; nextSteps: string[] } {
    
    const highRiskCategories = categories.filter(c => c.riskLevel === 'high').length;
    const moderateRiskCategories = categories.filter(c => c.riskLevel === 'moderate').length;
    
    let overallRiskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (highRiskCategories > 0 || moderateRiskCategories >= 2) {
      overallRiskLevel = 'high';
    } else if (moderateRiskCategories > 0) {
      overallRiskLevel = 'moderate';
    }
    
    const concernCategories = categories.filter(c => c.concerningAnswers > 0);
    let summary = '';
    
    if (totalConcerns === 0) {
      summary = `Great news! ${childName} appears to be meeting developmental milestones well across all assessed areas. Continue encouraging growth through play and communication.`;
    } else {
      const categoryNames = concernCategories.map(c => c.name.toLowerCase()).join(' and ');
      summary = `Based on developmental milestones for children around ${childAge.years} years, ${childAge.months} months old, ${childName} shows ${totalConcerns} area${totalConcerns !== 1 ? 's' : ''} that may benefit from additional attention in ${categoryNames}.`;
    }
    
    const nextSteps: string[] = [];
    if (overallRiskLevel === 'high') {
      nextSteps.push('Consider consultation with a pediatric speech-language pathologist');
      nextSteps.push('Discuss findings with your pediatrician');
    } else if (overallRiskLevel === 'moderate') {
      nextSteps.push('Monitor progress over the next 3-6 months');
      nextSteps.push('Implement suggested activities and strategies');
    }
    
    nextSteps.push('Continue regular play-based learning activities');
    nextSteps.push('Re-assess in 6 months to track progress');
    
    return { overallRiskLevel, summary, nextSteps };
  }

  private static generateEmergencyFallbackReport(
    data: AssessmentData,
    childAge: { years: number; months: number },
    childName: string
  ): AssessmentReport {
    return {
      childName,
      childAge,
      overallRiskLevel: 'moderate',
      totalConcerns: 0,
      categories: [{
        name: 'ASSESSMENT_ERROR',
        icon: '⚠️',
        description: 'Unable to complete full assessment due to technical issues. Please try again or consult with a professional.',
        totalQuestions: 0,
        concerningAnswers: 0,
        riskLevel: 'moderate',
        recommendations: ['Retry assessment when technical issues are resolved', 'Consider professional evaluation'],
        milestoneAlignment: 50,
        reasoning: 'Emergency fallback due to system error'
      }],
      summary: `We encountered technical difficulties while analyzing ${childName}'s assessment. Please try again later or consult with a pediatric specialist.`,
      nextSteps: ['Retry the assessment', 'Contact technical support if issues persist', 'Consider professional consultation'],
      aiPowered: false
    };
  }
}