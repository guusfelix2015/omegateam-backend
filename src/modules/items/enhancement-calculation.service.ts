/**
 * Enhancement Calculation Service
 * 
 * Handles the calculation of enhancement bonuses for items
 * Formula:
 * - +1 to +3: +1 GS per level
 * - +4 to +12: +3 GS per level (cumulative)
 */
export class EnhancementCalculationService {
  /**
   * Calculate enhancement bonus for an item
   * 
   * @param enhancementLevel - Enhancement level (0-12)
   * @returns Enhancement bonus GS
   * @throws Error if level is out of range
   */
  calculateEnhancementBonus(enhancementLevel: number): number {
    if (enhancementLevel < 0 || enhancementLevel > 12) {
      throw new Error('Enhancement level must be between 0 and 12');
    }

    if (enhancementLevel === 0) {
      return 0;
    }

    if (enhancementLevel <= 3) {
      // +1 to +3: +1 GS per level
      return enhancementLevel;
    }

    // +4 to +12: +3 from levels 1-3, then +3 per level from 4 onwards
    const baseBonus = 3; // From levels 1-3
    const additionalLevels = enhancementLevel - 3;
    const additionalBonus = additionalLevels * 3;
    
    return baseBonus + additionalBonus;
  }

  /**
   * Calculate total GS for an item including enhancement
   * 
   * @param baseGS - Base GS of the item (valorGsInt)
   * @param enhancementLevel - Enhancement level (0-12)
   * @returns Total GS (base + enhancement bonus)
   */
  calculateTotalItemGS(baseGS: number, enhancementLevel: number): number {
    const enhancementBonus = this.calculateEnhancementBonus(enhancementLevel);
    return baseGS + enhancementBonus;
  }

  /**
   * Calculate total gear score for multiple items
   * 
   * @param items - Array of items with base GS and enhancement levels
   * @returns Total gear score
   */
  calculateTotalGearScore(
    items: Array<{ baseGS: number; enhancementLevel: number }>
  ): number {
    return items.reduce((total, item) => {
      return total + this.calculateTotalItemGS(item.baseGS, item.enhancementLevel);
    }, 0);
  }
}

