'use client';

import * as React from 'react';
import type { PlayBeat } from '@/lib/validators/play';
import type { Character } from '@/db/schema';
import { formatPlayAsScreenplayText, formatPlayAsMarkdown } from '@/lib/play-export';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Copy, Check, Download, X, FileText, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayExportModalProps {
  open: boolean;
  onClose: () => void;
  beats: PlayBeat[];
  characterMap: Map<string, Character>;
  sceneTitle: string;
}

export function PlayExportModal({
  open,
  onClose,
  beats,
  characterMap,
  sceneTitle,
}: PlayExportModalProps) {
  const [format, setFormat] = React.useState<'screenplay' | 'markdown'>('screenplay');
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const charNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const [id, char] of characterMap.entries()) {
      map.set(id, char.name);
    }
    return map;
  }, [characterMap]);

  const exportedText = React.useMemo(() => {
    if (format === 'screenplay') {
      return formatPlayAsScreenplayText(beats, charNameMap, sceneTitle);
    } else {
      return formatPlayAsMarkdown(beats, charNameMap, sceneTitle);
    }
  }, [format, beats, charNameMap, sceneTitle]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedText);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: `Exported ${beats.length} beats as ${format === 'screenplay' ? 'Screenplay Text' : 'Markdown'}.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not access clipboard.',
        variant: 'error',
      });
    }
  };

  const handleDownload = () => {
    const filename = `${sceneTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'scene_play'}.${
      format === 'screenplay' ? 'txt' : 'md'
    }`;
    const blob = new Blob([exportedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-lg border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="text-base font-bold text-ink">Export Scene Play</h3>
            <p className="text-xs text-ink-soft">
              Copy or download this scripted scene in screenplay or markdown format.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-surface-sunken p-0.5 rounded-md border border-line">
            <button
              type="button"
              onClick={() => setFormat('screenplay')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-colors',
                format === 'screenplay'
                  ? 'bg-surface text-brand shadow-xs border border-line/80'
                  : 'text-ink-soft hover:text-ink'
              )}
            >
              <FileText className="h-3.5 w-3.5" /> Plain Text Screenplay
            </button>
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-colors',
                format === 'markdown'
                  ? 'bg-surface text-brand shadow-xs border border-line/80'
                  : 'text-ink-soft hover:text-ink'
              )}
            >
              <Code className="h-3.5 w-3.5" /> Markdown
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs h-8"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs h-8"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        </div>

        {/* Live Preview Screenplay Box */}
        <div className="rounded-md border border-line bg-surface-sunken p-4 max-h-80 overflow-y-auto">
          <pre className="font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed select-text">
            {exportedText || '// No beats scripted yet in this play.'}
          </pre>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1">
          <span>{beats.length} beats scripted</span>
          <span>Courier Prime Monospace screenplay format</span>
        </div>
      </div>
    </div>
  );
}
