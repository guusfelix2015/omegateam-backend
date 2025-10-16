import { describe, it, expect } from '@jest/globals';
import { DkpCalculationService } from './dkp-calculation.service';

describe('DkpCalculationService - Class Bonus', () => {
  const service = new DkpCalculationService();

  describe('calculateDkpForParticipant', () => {
    it('should calculate DKP without bonus for non-support class', () => {
      const result = service.calculateDkpForParticipant(80, 100, 'Gladiator');
      
      expect(result.dkpPoints).toBe(80);
      expect(result.classBonusApplied).toBe(false);
    });

    it('should calculate DKP with 15% bonus for Bishop', () => {
      const result = service.calculateDkpForParticipant(80, 100, 'Bishop');
      
      // Base: (80 * 100) / 100 = 80
      // With bonus: 80 * 1.15 = 92
      expect(result.dkpPoints).toBe(92);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should calculate DKP with 15% bonus for Elven Elder', () => {
      const result = service.calculateDkpForParticipant(85, 150, 'Elven Elder');
      
      // Base: (85 * 150) / 100 = 127.5
      // With bonus: 127.5 * 1.15 = 146.625 -> rounds to 147
      expect(result.dkpPoints).toBe(147);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should calculate DKP with 15% bonus for Shillen Elder', () => {
      const result = service.calculateDkpForParticipant(75, 120, 'Shillen Elder');
      
      // Base: (75 * 120) / 100 = 90
      // With bonus: 90 * 1.15 = 103.5 -> rounds to 104
      expect(result.dkpPoints).toBe(104);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should calculate DKP with 15% bonus for Overlord', () => {
      const result = service.calculateDkpForParticipant(80, 100, 'Overlord');
      
      expect(result.dkpPoints).toBe(92);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should calculate DKP with 15% bonus for Warcryer', () => {
      const result = service.calculateDkpForParticipant(80, 100, 'Warcryer');
      
      expect(result.dkpPoints).toBe(92);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should calculate DKP with 15% bonus for Prophet', () => {
      const result = service.calculateDkpForParticipant(80, 100, 'Prophet');
      
      expect(result.dkpPoints).toBe(92);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should not apply bonus when className is null', () => {
      const result = service.calculateDkpForParticipant(80, 100, null);
      
      expect(result.dkpPoints).toBe(80);
      expect(result.classBonusApplied).toBe(false);
    });

    it('should not apply bonus when className is undefined', () => {
      const result = service.calculateDkpForParticipant(80, 100);
      
      expect(result.dkpPoints).toBe(80);
      expect(result.classBonusApplied).toBe(false);
    });

    it('should not apply bonus for case-sensitive mismatch', () => {
      const result = service.calculateDkpForParticipant(80, 100, 'bishop'); // lowercase
      
      expect(result.dkpPoints).toBe(80);
      expect(result.classBonusApplied).toBe(false);
    });

    it('should handle rounding correctly with bonus', () => {
      const result = service.calculateDkpForParticipant(77, 77, 'Bishop');
      
      // Base: (77 * 77) / 100 = 59.29
      // With bonus: 59.29 * 1.15 = 68.1835 -> rounds to 68
      expect(result.dkpPoints).toBe(68);
      expect(result.classBonusApplied).toBe(true);
    });

    it('should throw error for invalid boss level', () => {
      expect(() => {
        service.calculateDkpForParticipant(0, 100, 'Bishop');
      }).toThrow('Invalid parameters for DKP calculation');
    });

    it('should throw error for negative gear score', () => {
      expect(() => {
        service.calculateDkpForParticipant(80, -10, 'Bishop');
      }).toThrow('Invalid parameters for DKP calculation');
    });
  });

  describe('previewDkpCalculation', () => {
    it('should calculate preview with mixed support and non-support classes', () => {
      const participants = [
        { userId: '1', name: 'Player1', gearScore: 100, className: 'Bishop' },
        { userId: '2', name: 'Player2', gearScore: 100, className: 'Gladiator' },
        { userId: '3', name: 'Player3', gearScore: 100, className: 'Warcryer' },
      ];

      const result = service.previewDkpCalculation(80, participants);

      // Bishop: 92, Gladiator: 80, Warcryer: 92
      expect(result.totalDkpToAward).toBe(264);
      expect(result.averageDkpPerParticipant).toBe(88); // floor(264/3)
      expect(result.participants).toHaveLength(3);
      
      expect(result.participants[0].dkpAwarded).toBe(92);
      expect(result.participants[0].classBonusApplied).toBe(true);
      
      expect(result.participants[1].dkpAwarded).toBe(80);
      expect(result.participants[1].classBonusApplied).toBe(false);
      
      expect(result.participants[2].dkpAwarded).toBe(92);
      expect(result.participants[2].classBonusApplied).toBe(true);
    });

    it('should handle participants without class names', () => {
      const participants = [
        { userId: '1', name: 'Player1', gearScore: 100 },
        { userId: '2', name: 'Player2', gearScore: 100, className: null },
      ];

      const result = service.previewDkpCalculation(80, participants);

      expect(result.totalDkpToAward).toBe(160);
      expect(result.participants[0].classBonusApplied).toBe(false);
      expect(result.participants[1].classBonusApplied).toBe(false);
    });
  });

  describe('Support Classes List', () => {
    const supportClasses = [
      'Bishop',
      'Elven Elder',
      'Shillen Elder',
      'Overlord',
      'Warcryer',
      'Prophet',
    ];

    it('should have exactly 6 support classes', () => {
      // This test verifies all support classes receive bonus
      supportClasses.forEach(className => {
        const result = service.calculateDkpForParticipant(100, 100, className);
        expect(result.classBonusApplied).toBe(true);
        expect(result.dkpPoints).toBe(115); // 100 * 1.15
      });
    });

    const nonSupportClasses = [
      'Gladiator',
      'Warlord',
      'Paladin',
      'Dark Avenger',
      'Sorcerer',
      'Necromancer',
    ];

    it('should not apply bonus to non-support classes', () => {
      nonSupportClasses.forEach(className => {
        const result = service.calculateDkpForParticipant(100, 100, className);
        expect(result.classBonusApplied).toBe(false);
        expect(result.dkpPoints).toBe(100);
      });
    });
  });
});

