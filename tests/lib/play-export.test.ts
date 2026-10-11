import { describe, it, expect } from 'vitest';
import {
  formatPlayAsScreenplayText,
  formatPlayAsMarkdown,
} from '@/lib/play-export';
import { v7 as uuidv7 } from 'uuid';

describe('Screenplay Export Engine (PRD §8.6)', () => {
  const arjunId = uuidv7();
  const mayaId = uuidv7();
  const charMap = new Map<string, string>([
    [arjunId, 'Inspector Arjun'],
    [mayaId, 'Maya Roy'],
  ]);

  const beats = [
    {
      id: uuidv7(),
      type: 'action' as const,
      text: 'Steam hisses from locomotive 402 as the passengers disembark.',
    },
    {
      id: uuidv7(),
      type: 'dialogue' as const,
      characterId: arjunId,
      text: 'You kept the telegram, didn’t you?',
    },
    {
      id: uuidv7(),
      type: 'direction' as const,
      text: '(stepping closer, voice lowered)',
    },
    {
      id: uuidv7(),
      type: 'dialogue' as const,
      characterId: mayaId,
      text: 'Burned it. Just like you instructed.',
    },
    {
      id: uuidv7(),
      type: 'narrator_note' as const,
      text: 'Her hands tremble slightly as she adjusts her shawl.',
    },
  ];

  describe('formatPlayAsScreenplayText', () => {
    it('formats screenplay text with standard margins and caps', () => {
      const output = formatPlayAsScreenplayText(beats, charMap, 'Jaipur Railway Station');

      expect(output).toContain('SCENE: JAIPUR RAILWAY STATION');
      expect(output).toContain('Steam hisses from locomotive 402');
      expect(output).toContain('                    INSPECTOR ARJUN');
      expect(output).toContain('          "You kept the telegram, didn’t you?"');
      expect(output).toContain('               (stepping closer, voice lowered)');
      expect(output).toContain('                    MAYA ROY');
      expect(output).toContain('          "Burned it. Just like you instructed."');
      expect(output).toContain('[NARRATOR NOTE: Her hands tremble slightly as she adjusts her shawl.]');
    });

    it('falls back to SPEAKER when characterId is not in map or null', () => {
      const unassignedBeats = [
        {
          id: uuidv7(),
          type: 'dialogue' as const,
          characterId: null,
          text: 'Unknown voice speaks.',
        },
      ];
      const output = formatPlayAsScreenplayText(unassignedBeats, charMap);
      expect(output).toContain('                    SPEAKER');
      expect(output).toContain('          "Unknown voice speaks."');
    });
  });

  describe('formatPlayAsMarkdown', () => {
    it('formats clean markdown with bold character names and blockquotes', () => {
      const output = formatPlayAsMarkdown(beats, charMap, 'Jaipur Railway Station');

      expect(output).toContain('### Jaipur Railway Station');
      expect(output).toContain('Steam hisses from locomotive 402');
      expect(output).toContain('**INSPECTOR ARJUN**');
      expect(output).toContain('> "You kept the telegram, didn’t you?"');
      expect(output).toContain('*(stepping closer, voice lowered)*');
      expect(output).toContain('**MAYA ROY**');
      expect(output).toContain('> "Burned it. Just like you instructed."');
      expect(output).toContain('> 📝 *Narrator Note: Her hands tremble slightly as she adjusts her shawl.*');
    });
  });
});
