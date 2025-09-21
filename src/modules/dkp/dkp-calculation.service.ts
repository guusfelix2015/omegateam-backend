/**
 * DKP Calculation Service
 *
 * Handles the core DKP calculation logic based on the formula:
 * DKP = (Boss Level × Gear Score) ÷ 100
 */
export class DkpCalculationService {
  /**
   * Calculate DKP points for a participant based on raid and gear score
   *
   * @param bossLevel - The level of the raid boss
   * @param gearScore - The participant's gear score at time of raid
   * @returns Calculated DKP points (rounded to integer)
   */
  calculateDkpForParticipant(
    bossLevel: number,
    gearScore: number
  ): number {
    if (bossLevel <= 0 || gearScore < 0) {
      throw new Error('Invalid parameters for DKP calculation');
    }

    // Formula: DKP = (Boss Level × Gear Score) ÷ 100
    const dkpPoints = (bossLevel * gearScore) / 100;

    // Round to nearest integer
    return Math.round(dkpPoints);
  }

  /**
   * Calculate DKP for multiple participants
   *
   * @param bossLevel - The level of the raid boss
   * @param participants - Array of participants with their gear scores
   * @returns Array of participants with calculated DKP
   */
  calculateDkpForMultipleParticipants(
    bossLevel: number,
    participants: Array<{ userId: string; gearScore: number }>
  ): Array<{ userId: string; gearScore: number; dkpAwarded: number }> {
    return participants.map(participant => ({
      ...participant,
      dkpAwarded: this.calculateDkpForParticipant(
        bossLevel,
        participant.gearScore
      ),
    }));
  }

  /**
   * Validate DKP calculation parameters
   *
   * @param bossLevel - The level of the raid boss
   * @param baseScore - The base score multiplier for the raid
   * @param gearScore - The participant's gear score
   * @returns Validation result with any error messages
   */
  validateCalculationParameters(
    bossLevel: number,
    baseScore: number,
    gearScore: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isInteger(bossLevel) || bossLevel <= 0) {
      errors.push('Boss level must be a positive integer');
    }

    if (!Number.isInteger(baseScore) || baseScore <= 0) {
      errors.push('Base score must be a positive integer');
    }

    if (!Number.isInteger(gearScore) || gearScore < 0) {
      errors.push('Gear score must be a non-negative integer');
    }

    if (bossLevel > 100) {
      errors.push('Boss level cannot exceed 100');
    }

    if (baseScore > 1000) {
      errors.push('Base score cannot exceed 1000');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get DKP calculation preview without actually awarding points
   *
   * @param bossLevel - The level of the raid boss
   * @param participants - Array of participants with their gear scores
   * @returns Preview of DKP calculations
   */
  previewDkpCalculation(
    bossLevel: number,
    participants: Array<{ userId: string; name: string; gearScore: number }>
  ): {
    totalDkpToAward: number;
    averageDkpPerParticipant: number;
    participants: Array<{
      userId: string;
      name: string;
      gearScore: number;
      dkpAwarded: number;
    }>;
  } {
    const calculatedParticipants = participants.map(participant => ({
      ...participant,
      dkpAwarded: this.calculateDkpForParticipant(
        bossLevel,
        participant.gearScore
      ),
    }));

    const totalDkpToAward = calculatedParticipants.reduce(
      (sum, p) => sum + p.dkpAwarded,
      0
    );

    const averageDkpPerParticipant = participants.length > 0
      ? Math.floor(totalDkpToAward / participants.length)
      : 0;

    return {
      totalDkpToAward,
      averageDkpPerParticipant,
      participants: calculatedParticipants,
    };
  }
}
