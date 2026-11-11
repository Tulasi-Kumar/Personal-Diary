import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { addPiece, updateDay } from '../../lib/db/repositories';
import { enqueuePolish } from '../../lib/ai/queue';

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function VoiceSheet({
  open,
  onClose,
  date,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  onSaved: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const recognition = useRef<SpeechRecognitionInstance | null>(null);
  const toast = useToast();

  useEffect(() => {
    const Constructor = getRecognitionConstructor();
    setSupported(Boolean(Constructor));
    if (!Constructor || !open) return;

    const instance = new Constructor();
    instance.lang = navigator.language || 'en-US';
    instance.continuous = true;
    instance.interimResults = true;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      setListening(true);
      setError(null);
    };
    instance.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) setFinalText((previous) => `${previous}${finalChunk}`);
      setInterim(interimChunk);
    };
    instance.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('The microphone is not available. You can still type this piece.');
      } else if (event.error === 'no-speech') {
        setError('No words arrived. Try again when you are ready.');
      } else {
        setError('Listening stopped. Your words so far are safe.');
      }
    };
    instance.onend = () => setListening(false);

    recognition.current = instance;
    try {
      instance.start();
    } catch {
      setError('Listening could not start. You can still type this piece.');
    }

    return () => {
      instance.onresult = null;
      instance.onerror = null;
      instance.onend = null;
      instance.onstart = null;
      try {
        instance.abort();
      } catch {
        // The recognizer may already be stopped.
      }
      recognition.current = null;
      setListening(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFinalText('');
      setInterim('');
      setError(null);
      setListening(false);
    }
  }, [open]);

  function stop() {
    try {
      recognition.current?.stop();
    } catch {
      // Ignore a recognizer that has already stopped.
    }
    setListening(false);
  }

  function restart() {
    setError(null);
    try {
      recognition.current?.start();
    } catch {
      setError('Listening could not start. You can still type this piece.');
    }
  }

  async function save() {
    const text = `${finalText}${interim}`.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const piece = await addPiece({ date, kind: 'voice', text, source: 'spoken' });
      await updateDay(date, { storyStatus: 'queued' });
      void enqueuePolish(piece.id);
      toast.show('Spoken piece saved.');
      onSaved();
      onClose();
    } catch {
      toast.show('That piece could not be saved. Try once more.');
    } finally {
      setSaving(false);
    }
  }

  const text = `${finalText}${interim}`.trim();

  return (
    <Sheet open={open} onClose={onClose} title="Speak a piece">
      {!supported ? (
        <div className="stack stack-4">
          <p className="body muted">
            This browser cannot listen yet. You can still write this piece in the editor.
          </p>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Type instead
          </button>
        </div>
      ) : (
        <div className="stack stack-5">
          <div className="voice-status" aria-live="polite">
            <span className={`voice-dot${listening ? ' is-listening' : ''}`} aria-hidden="true" />
            <span className="quiet-line">
              {listening ? 'Listening. Speak naturally.' : 'Listening is paused.'}
            </span>
          </div>

          <div className="voice-words" aria-label="Spoken words">
            {text ? (
              <p className="body-lg">{text}</p>
            ) : (
              <p className="body muted" style={{ fontStyle: 'italic' }}>
                Your words will appear here as you speak.
              </p>
            )}
          </div>

          {error ? <p className="meta danger">{error}</p> : null}

          <div className="row row--wrap">
            {listening ? (
              <button type="button" className="btn btn--secondary" onClick={stop}>
                <Square aria-hidden="true" style={{ width: 12, height: 12, fill: 'currentColor' }} />
                Pause
              </button>
            ) : (
              <button type="button" className="btn btn--secondary" onClick={restart}>
                <Mic aria-hidden="true" style={{ width: 14, height: 14 }} />
                Listen
              </button>
            )}
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void save()}
              disabled={!text || saving}
            >
              {saving ? 'Saving' : 'Save piece'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
          </div>

          <p className="meta">
            Speech is turned into text by your browser. Audio is not sent to the writing room.
          </p>
        </div>
      )}
    </Sheet>
  );
}
