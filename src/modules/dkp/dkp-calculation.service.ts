/**
 * DKP Calculation Service
 *
 * Handles the core DKP calculation logic based on the formula:
 * DKP = (Boss Level × Gear Score) ÷ 100
 *
 * Support classes receive a 15% bonus on DKP calculations.
 */
export class DkpCalculationService {
  // Support classes that receive 15% DKP bonus
  private static readonly SUPPORT_CLASSES = [
    'Bishop',
    'Elven Elder',
    'Shillen Elder',
    'Overlord',
    'Warcryer',
    'Prophet',
  ];

  // Class bonus multiplier (15% = 1.15)
  private static readonly CLASS_BONUS_MULTIPLIER = 1.15;

  /**
   * Check if a class name is a support class that receives DKP bonus
   *
   * @param className - The name of the player's class
   * @returns True if the class receives bonus, false otherwise
   */
  private isSupportClass(className: string | null | undefined): boolean {
    if (!className) return false;
    return DkpCalculationService.SUPPORT_CLASSES.includes(className);
  }

  /**
   * Calculate DKP points for a participant based on raid and gear score
   *
   * @param bossLevel - The level of the raid boss
   * @param gearScore - The participant's gear score at time of raid
   * @param className - Optional class name to apply support class bonus
   * @returns Object with calculated DKP points and whether bonus was applied
   */
  calculateDkpForParticipant(
    bossLevel: number,
    gearScore: number,
    className?: string | null
  ): { dkpPoints: number; classBonusApplied: boolean } {
    if (bossLevel <= 0 || gearScore < 0) {
      throw new Error('Invalid parameters for DKP calculation');
    }

    // Formula: DKP = (Boss Level × Gear Score) ÷ 100
    let dkpPoints = (bossLevel * gearScore) / 100;

    // Apply class bonus if applicable
    const classBonusApplied = this.isSupportClass(className);
    if (classBonusApplied) {
      dkpPoints *= DkpCalculationService.CLASS_BONUS_MULTIPLIER;
    }

    // Round to nearest integer
    return {
      dkpPoints: Math.round(dkpPoints),
      classBonusApplied,
    };
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
    return participants.map(participant => {
      const dkpResult = this.calculateDkpForParticipant(
        bossLevel,
        participant.gearScore
      );
      return {
        ...participant,
        dkpAwarded: dkpResult.dkpPoints,
      };
    });
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
   * @param participants - Array of participants with their gear scores and class names
   * @returns Preview of DKP calculations
   */
  previewDkpCalculation(
    bossLevel: number,
    participants: Array<{
      userId: string;
      name: string;
      gearScore: number;
      className?: string | null;
    }>
  ): {
    totalDkpToAward: number;
    averageDkpPerParticipant: number;
    participants: Array<{
      userId: string;
      name: string;
      gearScore: number;
      dkpAwarded: number;
      classBonusApplied: boolean;
    }>;
  } {
    const calculatedParticipants = participants.map(participant => {
      const result = this.calculateDkpForParticipant(
        bossLevel,
        participant.gearScore,
        participant.className
      );
      return {
        ...participant,
        dkpAwarded: result.dkpPoints,
        classBonusApplied: result.classBonusApplied,
      };
    });

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
