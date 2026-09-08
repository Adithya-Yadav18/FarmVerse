import React, { useState, useEffect, useRef } from 'react';
import {
  MdMic,
  MdMicOff,
  MdVolumeUp,
  MdStop,
  MdSend,
  MdTranslate,
  MdCheckCircle,
  MdHistory,
  MdDeleteOutline,
  MdAutoAwesome,
  MdRecordVoiceOver,
} from 'react-icons/md';
import styles from './VoiceAssistantPage.module.css';
import voiceService from '../../services/voiceService';
import type {
  VoiceLanguage,
  SupportedLanguageCode,
  VoiceAdvisoryResult,
  VoicePreset,
  VoiceConsultationHistoryItem,
} from '../../types';

const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', speechLocale: 'hi-IN', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', speechLocale: 'kn-IN', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', speechLocale: 'ta-IN', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', speechLocale: 'te-IN', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', speechLocale: 'mr-IN', flag: '🇮🇳' },
  { code: 'en', label: 'English', nativeLabel: 'English (IN)', speechLocale: 'en-IN', flag: '🌐' },
];

export default function VoiceAssistantPage() {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageCode>('hi');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VoiceAdvisoryResult | null>(null);
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  const [history, setHistory] = useState<VoiceConsultationHistoryItem[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  // Load presets & history
  useEffect(() => {
    loadPresets(selectedLang);
    loadHistory();
  }, [selectedLang]);

  // Clean up audio speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadPresets = async (lang: string) => {
    try {
      const data = await voiceService.getPresets(lang);
      setPresets(data);
    } catch (err) {
      console.error('Error fetching voice presets:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await voiceService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error loading voice history:', err);
    }
  };

  // Web Speech Recognition (Speech-to-Text)
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please type your question in the text box.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = activeLangConfig.speechLocale;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Submit Query to Backend
  const handleQuerySubmit = async (queryText?: string) => {
    const textToSubmit = queryText || transcript;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    stopSpeaking();

    try {
      const advisory = await voiceService.ask({
        queryText: textToSubmit,
        languageCode: selectedLang,
      });
      setResult(advisory);
      setTranscript('');
      loadHistory();
      // Auto-play spoken response
      speakText(advisory.spokenResponse, activeLangConfig.speechLocale);
    } catch (err) {
      console.error('Failed to get voice advisory:', err);
      alert('Could not process voice query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Web Speech Synthesis (Text-to-Speech)
  const speakText = (text: string, locale: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.92; // Slightly slower for clarity in field environments
    utterance.pitch = 1.0;

    // Try to match appropriate native voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === locale || v.lang.startsWith(locale.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await voiceService.deleteHistory(id);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerBadge}>
          <MdRecordVoiceOver />
          <span>Multilingual Voice AI • 6 Regional Indian Languages</span>
        </div>
        <h1 className={styles.headerTitle}>
          <MdAutoAwesome color="#2d6a4f" />
          Kisan Vani AI Krishi Mitra
        </h1>
        <p className={styles.headerSubtitle}>
          Speak naturally in your native language to receive instantaneous agronomic advice, disease diagnoses, fertilizer dosages, and weather guidance with human-like audio speech playback.
        </p>
      </header>

      {/* Language Switcher */}
      <div className={styles.languageBar}>
        {SUPPORTED_LANGUAGES.map(lang => (
          <button
            key={lang.code}
            className={`${styles.langBtn} ${selectedLang === lang.code ? styles.langBtnActive : ''}`}
            onClick={() => {
              setSelectedLang(lang.code);
              stopSpeaking();
            }}
          >
            <span>{lang.flag}</span>
            <span className={styles.nativeScript}>{lang.nativeLabel}</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>({lang.label})</span>
          </button>
        ))}
      </div>

      {/* Voice Cockpit */}
      <div className={styles.cockpitCard}>
        <div className={styles.micWrapper}>
          {isListening && <div className={styles.listeningRipple} />}
          <button
            className={`${styles.micBtn} ${isListening ? styles.micBtnListening : ''}`}
            onClick={toggleListening}
            title={isListening ? 'Click to Stop Listening' : 'Click to Speak'}
          >
            {isListening ? <MdMicOff /> : <MdMic />}
          </button>

          <div className={styles.micStatusText}>
            {isListening ? (
              <>
                <span>Listening in {activeLangConfig.nativeLabel}... (Speak now)</span>
                <div className={styles.listeningWaves}>
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                  <div className={styles.waveBar} />
                </div>
              </>
            ) : (
              <span>Tap Microphone to Speak in {activeLangConfig.nativeLabel}</span>
            )}
          </div>
        </div>

        {/* Input Text Form */}
        <form
          className={styles.inputForm}
          onSubmit={e => {
            e.preventDefault();
            handleQuerySubmit();
          }}
        >
          <input
            type="text"
            className={styles.inputField}
            placeholder={`Ask any farming question in ${activeLangConfig.nativeLabel} or English...`}
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
          />
          <button type="submit" className={styles.submitBtn} disabled={loading || !transcript.trim()}>
            <MdSend size={16} />
            {loading ? 'Consulting...' : 'Ask'}
          </button>
        </form>

        {/* Quick Voice Chips */}
        {presets.length > 0 && (
          <div className={styles.presetsSection}>
            <div className={styles.presetsLabel}>
              💡 Quick Voice Prompts in {activeLangConfig.nativeLabel}:
            </div>
            <div className={styles.presetChips}>
              {presets.map(p => (
                <button
                  key={p.id}
                  className={styles.presetChip}
                  onClick={() => {
                    setTranscript(p.promptText);
                    handleQuerySubmit(p.promptText);
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.promptText}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Section */}
      {result && (
        <div className={styles.resultCard}>
          <div className={styles.resultTop}>
            <h3 className={styles.querySpoken}>
              <MdRecordVoiceOver color="#2d6a4f" />
              "{result.transcribedQuery}"
            </h3>

            <div className={styles.audioControls}>
              {isPlayingAudio ? (
                <button className={styles.stopAudioBtn} onClick={stopSpeaking}>
                  <MdStop size={16} style={{ verticalAlign: 'middle' }} /> Stop Audio
                </button>
              ) : (
                <button
                  className={styles.playAudioBtn}
                  onClick={() => speakText(result.spokenResponse, activeLangConfig.speechLocale)}
                >
                  <MdVolumeUp size={16} style={{ verticalAlign: 'middle' }} /> Replay Audio
                </button>
              )}
            </div>
          </div>

          {/* Spoken Response Box */}
          <div className={styles.spokenResponseBox}>
            <p className={styles.spokenResponseText}>{result.spokenResponse}</p>
          </div>

          {/* Formatted Written Advisory */}
          <div className={styles.advisoryContent} style={{ whiteSpace: 'pre-line' }}>
            {result.writtenAdvisory}
          </div>

          {/* Action Items */}
          {result.actionItems && result.actionItems.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, color: '#1b4332', marginBottom: 10, textTransform: 'uppercase' }}>
                Key Recommended Actions:
              </h4>
              <div className={styles.actionItemsGrid}>
                {result.actionItems.map((item, idx) => (
                  <div key={idx} className={styles.actionItemCard}>
                    <MdCheckCircle className={styles.actionItemIcon} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Follow-Ups */}
          {result.suggestedNextQuestions && result.suggestedNextQuestions.length > 0 && (
            <div className={styles.followUpsWrap}>
              <div className={styles.followUpsLabel}>Suggested Next Questions:</div>
              <div className={styles.followUpBtns}>
                {result.suggestedNextQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className={styles.followUpBtn}
                    onClick={() => {
                      setTranscript(q);
                      handleQuerySubmit(q);
                    }}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Consultation History */}
      {history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>
              <MdHistory style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Recent Voice Consultations
            </h3>
            <span style={{ fontSize: 13, color: '#668273' }}>{history.length} saved sessions</span>
          </div>

          <div className={styles.historyCards}>
            {history.slice(0, 6).map(h => (
              <div key={h.id} className={styles.historyCard}>
                <div>
                  <h4 className={styles.historyQuery}>"{h.transcribedQuery}"</h4>
                  <p className={styles.historyResponse}>{h.spokenResponse}</p>
                </div>
                <div className={styles.historyFooter}>
                  <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2d6a4f',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onClick={() => {
                        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === h.languageCode);
                        speakText(h.spokenResponse, langObj ? langObj.speechLocale : 'hi-IN');
                      }}
                    >
                      <MdVolumeUp size={16} /> Listen
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                      onClick={() => handleDeleteHistory(h.id)}
                      title="Delete log"
                    >
                      <MdDeleteOutline size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
