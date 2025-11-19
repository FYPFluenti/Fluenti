/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_MICROSOFT_SPEECH_KEY: string
  readonly VITE_MICROSOFT_SPEECH_REGION: string
  readonly REACT_APP_MICROSOFT_SPEECH_KEY: string
  readonly REACT_APP_MICROSOFT_SPEECH_REGION: string
  readonly VITE_SPEECH_API_KEY: string
  readonly VITE_CLINICAL_API_KEY: string
  readonly VITE_ARTICULATION_API_KEY: string
  readonly VITE_ENABLE_SPEECH_RECOGNITION: string
  readonly VITE_APP_ENV: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
