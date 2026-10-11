import type { PlayBeat } from './validators/play';

/**
 * Pure screenplay export engine per PRD §8.6
 * Converts beat arrays into industry-standard screenplay plain text and Markdown.
 */

/**
 * Formats beats into authentic plain text screenplay format
 */
export function formatPlayAsScreenplayText(
  beats: PlayBeat[],
  characterMap: Map<string, string>,
  sceneTitle?: string
): string {
  const lines: string[] = [];

  if (sceneTitle && sceneTitle.trim()) {
    lines.push(`SCENE: ${sceneTitle.trim().toUpperCase()}`);
    lines.push('');
  }

  for (const beat of beats) {
    const text = beat.text.trim();
    if (!text && beat.type !== 'direction') continue;

    switch (beat.type) {
      case 'dialogue': {
        const charName =
          beat.characterId && characterMap.has(beat.characterId)
            ? characterMap.get(beat.characterId)!.toUpperCase()
            : 'SPEAKER';

        lines.push(`                    ${charName}`);
        lines.push(`          "${text}"`);
        lines.push('');
        break;
      }

      case 'action': {
        lines.push(text);
        lines.push('');
        break;
      }

      case 'direction': {
        const cleanDir = text.replace(/^\(|\)$/g, '').trim();
        lines.push(`               (${cleanDir})`);
        lines.push('');
        break;
      }

      case 'narrator_note': {
        lines.push(`[NARRATOR NOTE: ${text}]`);
        lines.push('');
        break;
      }
    }
  }

  return lines.join('\n').trimEnd();
}

/**
 * Formats beats into clean Markdown format
 */
export function formatPlayAsMarkdown(
  beats: PlayBeat[],
  characterMap: Map<string, string>,
  sceneTitle?: string
): string {
  const lines: string[] = [];

  if (sceneTitle && sceneTitle.trim()) {
    lines.push(`### ${sceneTitle.trim()}`);
    lines.push('');
  }

  for (const beat of beats) {
    const text = beat.text.trim();
    if (!text && beat.type !== 'direction') continue;

    switch (beat.type) {
      case 'dialogue': {
        const charName =
          beat.characterId && characterMap.has(beat.characterId)
            ? characterMap.get(beat.characterId)!
            : 'Speaker';

        lines.push(`**${charName.toUpperCase()}**`);
        lines.push(`> "${text}"`);
        lines.push('');
        break;
      }

      case 'action': {
        lines.push(text);
        lines.push('');
        break;
      }

      case 'direction': {
        const cleanDir = text.replace(/^\(|\)$/g, '').trim();
        lines.push(`*(${cleanDir})*`);
        lines.push('');
        break;
      }

      case 'narrator_note': {
        lines.push(`> 📝 *Narrator Note: ${text}*`);
        lines.push('');
        break;
      }
    }
  }

  return lines.join('\n').trimEnd();
}
