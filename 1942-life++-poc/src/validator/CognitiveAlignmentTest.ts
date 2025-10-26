// ============================================================================
// src/validator/CognitiveAlignmentTest.ts - CAT Algorithm Implementation
// ============================================================================
import { ethers } from 'ethers';
import axios from 'axios';
import { EvidenceBundle, CATResult } from '../types';

/**
 * Cognitive Alignment Test (CAT) - Core validation logic
 */
export class CognitiveAlignmentTest {
  
  /**
   * Run complete CAT validation
   */
  async validate(proofId: string, evidenceBundle: EvidenceBundle): Promise<CATResult> {
    console.log(`🔍 Running CAT for proof: ${proofId}`);

    const checks = {
      syntaxCheck: false,
      causalCoherence: false,
      intentMatching: false,
      adversarialRobustness: false
    };
    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Syntax Check
    try {
      checks.syntaxCheck = await this.syntaxCheck(evidenceBundle);
      totalScore += checks.syntaxCheck ? 25 : 0;
      if (!checks.syntaxCheck) reasons.push('Syntax validation failed');
    } catch (error: any) {
      reasons.push(`Syntax check error: ${error.message}`);
    }

    // 2. Causal Coherence Check
    try {
      checks.causalCoherence = await this.causalCoherenceCheck(evidenceBundle);
      totalScore += checks.causalCoherence ? 25 : 0;
      if (!checks.causalCoherence) reasons.push('Causal coherence violation detected');
    } catch (error: any) {
      reasons.push(`Causal coherence error: ${error.message}`);
    }

    // 3. Intent Matching Check
    try {
      checks.intentMatching = await this.intentMatchingCheck(evidenceBundle);
      totalScore += checks.intentMatching ? 25 : 0;
      if (!checks.intentMatching) reasons.push('Output does not match expected intent');
    } catch (error: any) {
      reasons.push(`Intent matching error: ${error.message}`);
    }

    // 4. Adversarial Robustness Check
    try {
      checks.adversarialRobustness = await this.adversarialRobustnessCheck(evidenceBundle);
      totalScore += checks.adversarialRobustness ? 25 : 0;
      if (!checks.adversarialRobustness) reasons.push('Failed adversarial robustness test');
    } catch (error: any) {
      reasons.push(`Adversarial robustness error: ${error.message}`);
    }

    const passed = totalScore >= 75; // Require 3/4 checks to pass

    return {
      syntaxCheck: checks.syntaxCheck,
      causalCoherence: checks.causalCoherence,
      intentMatching: checks.intentMatching,
      adversarialRobustness: checks.adversarialRobustness,
      overallScore: totalScore,
      timestamp: Date.now()
    };
  }

  /**
   * 1. Syntax Check - Validate data structure and format
   */
  private async syntaxCheck(evidenceBundle: EvidenceBundle): Promise<boolean> {
    console.log('  📝 Running syntax check...');
    
    // Check required fields
    if (!evidenceBundle.agentId || !evidenceBundle.evidence) {
      return false;
    }

    // Check reasoning trace structure
    const reasoning = evidenceBundle.evidence.reasoning;
    if (!reasoning.traceId || !reasoning.modelVersion || !Array.isArray(reasoning.steps)) {
      return false;
    }

    // Check step structure
    for (const step of reasoning.steps) {
      if (!step.stepId || !step.operation || !step.evidenceHash) {
        return false;
      }
    }

    // Check model metadata
    const modelMeta = evidenceBundle.evidence.modelMeta;
    if (!modelMeta.modelName || !modelMeta.version || !modelMeta.provider) {
      return false;
    }

    console.log('  ✅ Syntax check passed');
    return true;
  }

  /**
   * 2. Causal Coherence Check - Validate logical flow
   */
  private async causalCoherenceCheck(evidenceBundle: EvidenceBundle): Promise<boolean> {
    console.log('  🔗 Running causal coherence check...');
    
    const reasoning = evidenceBundle.evidence.reasoning;
    const steps = reasoning.steps;

    // Check temporal ordering
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].timestamp < steps[i-1].timestamp) {
        console.log('  ❌ Temporal ordering violation');
        return false;
      }
    }

    // Check logical dependencies
    const operations = steps.map(s => s.operation);
    const requiredSequence = ['planning', 'execution', 'verification'];
    
    let sequenceIndex = 0;
    for (const op of operations) {
      if (op.includes(requiredSequence[sequenceIndex])) {
        sequenceIndex++;
        if (sequenceIndex >= requiredSequence.length) break;
      }
    }

    const hasValidSequence = sequenceIndex >= requiredSequence.length;
    console.log(`  ${hasValidSequence ? '✅' : '❌'} Causal coherence: ${hasValidSequence}`);
    return hasValidSequence;
  }

  /**
   * 3. Intent Matching Check - Validate output matches intent
   */
  private async intentMatchingCheck(evidenceBundle: EvidenceBundle): Promise<boolean> {
    console.log('  🎯 Running intent matching check...');
    
    const input = evidenceBundle.evidence.input;
    const output = evidenceBundle.evidence.output;

    // Simple intent matching (can be enhanced with ML models)
    if (input.command && output.status) {
      const commandMatch = input.command === 'move_to' && output.status === 'completed';
      const positionMatch = input.target && output.finalPosition && 
        JSON.stringify(input.target) === JSON.stringify(output.finalPosition);
      
      const matches = commandMatch && positionMatch;
      console.log(`  ${matches ? '✅' : '❌'} Intent matching: ${matches}`);
      return matches;
    }

    console.log('  ❌ Intent matching failed - insufficient data');
    return false;
  }

  /**
   * 4. Adversarial Robustness Check - Test against manipulation
   */
  private async adversarialRobustnessCheck(evidenceBundle: EvidenceBundle): Promise<boolean> {
    console.log('  🛡️ Running adversarial robustness check...');
    
    // Check for suspicious patterns
    const reasoning = evidenceBundle.evidence.reasoning;
    const steps = reasoning.steps;

    // Check for too-perfect execution (potential manipulation)
    const perfectSteps = steps.filter(step => 
      step.operation.includes('success') || step.operation.includes('completed')
    );
    
    const suspiciousRatio = perfectSteps.length / steps.length;
    if (suspiciousRatio > 0.8) {
      console.log('  ❌ Suspiciously perfect execution detected');
      return false;
    }

    // Check for reasonable execution time
    const totalTime = steps[steps.length - 1].timestamp - steps[0].timestamp;
    const reasonableTime = totalTime > 100 && totalTime < 10000; // 100ms to 10s
    
    console.log(`  ${reasonableTime ? '✅' : '❌'} Adversarial robustness: ${reasonableTime}`);
    return reasonableTime;
  }
}
