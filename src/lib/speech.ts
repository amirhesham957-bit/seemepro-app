export class SpeechService {
  private recognition: any;
  private isRecording = false;
  private onTranscriptUpdate: (transcript: string) => void;
  private onFillerWord: () => void;
  private interimTranscript = '';
  private finalTranscript = '';

  constructor(onTranscriptUpdate: (text: string) => void, onFillerWord: () => void) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onFillerWord = onFillerWord;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onresult = (event: any) => {
        this.interimTranscript = '';
        let newFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          } else {
            this.interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (newFinal) {
          this.finalTranscript += newFinal + ' ';
          this.checkForFillerWords(newFinal);
        }
        
        this.onTranscriptUpdate(this.finalTranscript + this.interimTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
      };
    } else {
      console.error("Speech Recognition API not supported in this browser.");
    }
  }

  private checkForFillerWords(text: string) {
    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (fillers.includes(word)) {
        this.onFillerWord();
      }
    }
  }

  start() {
    if (!this.recognition || this.isRecording) return;
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isRecording = true;
    try {
      this.recognition.start();
    } catch(e) {
      console.error("Failed to start speech recognition", e);
    }
  }

  stop(): string {
    if (!this.recognition || !this.isRecording) return this.finalTranscript;
    this.isRecording = false;
    this.recognition.stop();
    return this.finalTranscript;
  }
}
