// js/i18n.js
// ===================================================================
// INTERNATIONALIZATION (i18n) MODULE
// Multi-language support for EduAI - supports 10 languages
// ===================================================================

(function () {
  'use strict';

  // Supported languages
  const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: 'us' },
    { code: 'sq', name: 'Albanian', native: 'Shqip', flag: 'al' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: 'es' },
    { code: 'fr', name: 'French', native: 'Français', flag: 'fr' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: 'de' },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: 'pt' },
    { code: 'zh', name: 'Chinese', native: 'Chinese', flag: 'cn' },
    { code: 'ja', name: 'Japanese', native: 'Japanese', flag: 'jp' },
    { code: 'ar', name: 'Arabic', native: 'Arabic', flag: 'sa' },
    { code: 'ru', name: 'Russian', native: 'Russian', flag: 'ru' }
  ];

  // Translation dictionaries
  const translations = {
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.chat': 'AI Tutor',
      'nav.code': 'Code Editor',
      'nav.cyber': 'Cyber Lab',
      'nav.projects': 'Projects',
      'nav.textbook': 'Textbook',
      'nav.settings': 'Settings',
      
      // Chat
      'chat.placeholder': 'Ask me anything...',
      'chat.send': 'Send',
      'chat.clear': 'Clear Chat',
      'chat.thinking': 'Thinking...',
      'chat.privacy': 'Privacy Mode',
      'chat.history': 'Chat History',
      
      // Subjects
      'subject.math': 'Mathematics',
      'subject.coding': 'Coding',
      'subject.science': 'Science',
      'subject.history': 'History',
      'subject.geography': 'Geography',
      'subject.language': 'Language',
      'subject.english': 'English',
      'subject.albanian': 'Albanian',
      'subject.physics': 'Physics',
      'subject.chemistry': 'Chemistry',
      'subject.biology': 'Biology',
      'subject.economics': 'Economics',
      'subject.cyber': 'Cyber Safety',
      'subject.german': 'German',
      'subject.spanish': 'Spanish',
      'subject.french': 'French',
      
      // Sidebar labels
      'sidebar.aiTools': 'AI Tools',
      'sidebar.difficulty': 'Difficulty',
      'sidebar.examples': 'Quick Examples',
      'sidebar.options': 'Options',
      'sidebar.games': 'Games',
      'sidebar.curriculum': 'Curriculum',
      'sidebar.signin': 'Sign In / Register',
      
      // Difficulty levels
      'diff.preschool': 'Pre-school',
      'diff.primary': 'Primary',
      'diff.middle': 'Middle',
      'diff.advanced': 'Advanced',
      
      // Actions
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.delete': 'Delete',
      'action.edit': 'Edit',
      'action.create': 'Create',
      'action.close': 'Close',
      'action.confirm': 'Confirm',
      'action.loading': 'Loading...',
      'action.retry': 'Retry',
      
      // Settings
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.appLanguage': 'App Language',
      'settings.aiLanguage': 'AI Response Language',
      'settings.sameAsApp': 'Same as App',
      'settings.proficiency': 'Proficiency Level',
      'settings.beginner': 'Beginner',
      'settings.intermediate': 'Intermediate',
      'settings.advanced': 'Advanced',
      'settings.performance': 'Performance',
      'settings.hardware': 'Hardware Detection',
      'settings.profile': 'Profile',
      'settings.accessibility': 'Accessibility',
      'settings.about': 'About',
      
      // Performance
      'perf.detected': 'Detected Hardware',
      'perf.cpu': 'CPU',
      'perf.ram': 'RAM',
      'perf.gpu': 'GPU',
      'perf.profile': 'Performance Profile',
      'perf.ultra': 'Ultra',
      'perf.high': 'High',
      'perf.medium': 'Medium',
      'perf.low': 'Low',
      'perf.minimal': 'Minimal',
      'perf.model': 'AI Model',
      'perf.context': 'Context Length',
      'perf.kvCache': 'KV Cache',
      'perf.streaming': 'Streaming',
      'perf.docker': 'Docker Lab',
      
      // Errors
      'error.connection': 'Connection error. Please try again.',
      'error.ollama': 'Could not connect to Ollama.',
      'error.save': 'Failed to save.',
      'error.load': 'Failed to load.',
      'error.notFound': 'Not found.',
      
      // Auth
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.register': 'Register',
      'auth.username': 'Username',
      'auth.password': 'Password',
      'auth.welcome': 'Welcome',
      
      // Projects
      'projects.new': 'New Project',
      'projects.newFile': 'New File',
      'projects.save': 'Save File',
      'projects.run': 'Run',
      'projects.untitled': 'Untitled',
      
      // Cyber Lab
      'cyber.title': 'Cybersecurity Lab',
      'cyber.terminal': 'Terminal',
      'cyber.challenges': 'Challenges',
      'cyber.hints': 'Hints',
      
      // Accessibility
      'access.highContrast': 'High Contrast',
      'access.dyslexiaFont': 'Dyslexia Font',
      'access.fontSize': 'Font Size',
      'access.screenReader': 'Screen Reader Mode',
      'access.readAloud': 'Read Aloud',
      
      // Voice
      'voice.start': 'Start Voice Input',
      'voice.stop': 'Stop Voice Input',
      'voice.listening': 'Listening...',
      'voice.notSupported': 'Voice input not supported in this browser.'
    },
    
    sq: {
      // Navigation
      'nav.home': 'Kryefaqja',
      'nav.chat': 'Tutor AI',
      'nav.code': 'Editor Kodi',
      'nav.cyber': 'Lab Kiber',
      'nav.projects': 'Projekte',
      'nav.textbook': 'Tekste',
      'nav.settings': 'Cilësimet',
      
      // Chat
      'chat.placeholder': 'Më pyet çdo gjë...',
      'chat.send': 'Dërgo',
      'chat.clear': 'Pastro Bisedën',
      'chat.thinking': 'Duke menduar...',
      'chat.privacy': 'Modaliteti Privat',
      'chat.history': 'Historiku i Bisedës',
      
      // Subjects
      'subject.math': 'Matematikë',
      'subject.coding': 'Kodim',
      'subject.science': 'Shkencë',
      'subject.history': 'Histori',
      'subject.geography': 'Gjeografi',
      'subject.language': 'Gjuhë',
      'subject.english': 'Anglisht',
      'subject.albanian': 'Shqip',
      'subject.physics': 'Fizikë',
      'subject.chemistry': 'Kimi',
      'subject.biology': 'Biologji',
      'subject.economics': 'Ekonomi',
      'subject.cyber': 'Kibersiguri',
      'subject.german': 'Gjermanisht',
      'subject.spanish': 'Spanjisht',
      'subject.french': 'Frëngjisht',
      
      // Sidebar labels
      'sidebar.aiTools': 'Veglat AI',
      'sidebar.difficulty': 'Vështirësia',
      'sidebar.examples': 'Shembuj të Shpejtë',
      'sidebar.options': 'Opsionet',
      'sidebar.games': 'Lojëra',
      'sidebar.curriculum': 'Kurrikula',
      'sidebar.signin': 'Kyçu / Regjistrohu',
      
      // Difficulty levels
      'diff.preschool': 'Parashkollor',
      'diff.primary': 'Fillor',
      'diff.middle': 'I Mesëm',
      'diff.advanced': 'I Avancuar',
      
      // Actions
      'action.save': 'Ruaj',
      'action.cancel': 'Anulo',
      'action.delete': 'Fshi',
      'action.edit': 'Redakto',
      'action.create': 'Krijo',
      'action.close': 'Mbyll',
      'action.confirm': 'Konfirmo',
      'action.loading': 'Duke ngarkuar...',
      'action.retry': 'Riprovo',
      
      // Settings
      'settings.title': 'Cilësimet',
      'settings.language': 'Gjuha',
      'settings.appLanguage': 'Gjuha e Aplikacionit',
      'settings.aiLanguage': 'Gjuha e Përgjigjeve AI',
      'settings.sameAsApp': 'Same as App',
      'settings.proficiency': 'Niveli i Aftësisë',
      'settings.beginner': 'Fillestar',
      'settings.intermediate': 'Mesatar',
      'settings.advanced': 'I Avancuar',
      'settings.performance': 'Performanca',
      'settings.hardware': 'Zbulim Hardware',
      'settings.profile': 'Profil',
      'settings.accessibility': 'Aksesueshmëri',
      'settings.about': 'Rreth',
      
      // Performance
      'perf.detected': 'Hardware i Zbuluar',
      'perf.cpu': 'CPU',
      'perf.ram': 'RAM',
      'perf.gpu': 'GPU',
      'perf.profile': 'Profil Performance',
      'perf.ultra': 'Ultra',
      'perf.high': 'I Lartë',
      'perf.medium': 'Mesatar',
      'perf.low': 'I Ulët',
      'perf.minimal': 'Minimal',
      'perf.model': 'Model AI',
      'perf.context': 'Gjatësia e Kontekstit',
      'perf.kvCache': 'KV Cache',
      'perf.streaming': 'Streaming',
      'perf.docker': 'Lab Docker',
      
      // Errors
      'error.connection': 'Gabim lidhjeje. Provoni përsëri.',
      'error.ollama': 'Nuk u lidh me Ollama.',
      'error.save': 'Dështoi ruajtja.',
      'error.load': 'Dështoi ngarkimi.',
      'error.notFound': 'Nuk u gjet.',
      
      // Auth
      'auth.login': 'Kyçu',
      'auth.logout': 'Çkyçu',
      'auth.register': 'Regjistrohu',
      'auth.username': 'Përdoruesi',
      'auth.password': 'Fjalëkalimi',
      'auth.welcome': 'Mirësevini',
      
      // Projects
      'projects.new': 'Projekt i Ri',
      'projects.newFile': 'Skedar i Ri',
      'projects.save': 'Ruaj Skedarin',
      'projects.run': 'Ekzekuto',
      'projects.untitled': 'Pa Titull',
      
      // Cyber Lab
      'cyber.title': 'Laborator Kibersigurie',
      'cyber.terminal': 'Terminal',
      'cyber.challenges': 'Sfidat',
      'cyber.hints': 'Ndihmë',
      
      // Accessibility
      'access.highContrast': 'Kontrast i Lartë',
      'access.dyslexiaFont': 'Font Disleksie',
      'access.fontSize': 'Madhësia e Fontit',
      'access.screenReader': 'Modaliteti Screen Reader',
      'access.readAloud': 'Lexo Me Zë',
      
      // Voice
      'voice.start': 'Fillo Hyrje me Zë',
      'voice.stop': 'Ndale Hyrjen me Zë',
      'voice.listening': 'Duke dëgjuar...',
      'voice.notSupported': 'Hyrja me zë nuk mbështetet në këtë browser.'
    },
    
    es: {
      'nav.home': 'Inicio',
      'nav.chat': 'Tutor AI',
      'nav.code': 'Editor de Código',
      'nav.settings': 'Configuración',
      'chat.placeholder': 'Pregúntame lo que quieras...',
      'chat.send': 'Enviar',
      'action.save': 'Guardar',
      'action.cancel': 'Cancelar',
      'settings.title': 'Configuración',
      'settings.language': 'Idioma',
      'auth.login': 'Iniciar Sesión',
      'auth.logout': 'Cerrar Sesión',
      'subject.math': 'Matemáticas',
      'subject.coding': 'Programación',
      'subject.science': 'Ciencias'
    },
    
    fr: {
      'nav.home': 'Accueil',
      'nav.chat': 'Tuteur AI',
      'nav.code': 'Éditeur de Code',
      'nav.settings': 'Paramètres',
      'chat.placeholder': 'Posez-moi une question...',
      'chat.send': 'Envoyer',
      'action.save': 'Enregistrer',
      'action.cancel': 'Annuler',
      'settings.title': 'Paramètres',
      'settings.language': 'Langue',
      'auth.login': 'Connexion',
      'auth.logout': 'Déconnexion',
      'subject.math': 'Mathématiques',
      'subject.coding': 'Programmation',
      'subject.science': 'Sciences'
    },
    
    de: {
      'nav.home': 'Startseite',
      'nav.chat': 'KI-Tutor',
      'nav.code': 'Code-Editor',
      'nav.settings': 'Einstellungen',
      'chat.placeholder': 'Frag mich alles...',
      'chat.send': 'Senden',
      'action.save': 'Speichern',
      'action.cancel': 'Abbrechen',
      'settings.title': 'Einstellungen',
      'settings.language': 'Sprache',
      'auth.login': 'Anmelden',
      'auth.logout': 'Abmelden',
      'subject.math': 'Mathematik',
      'subject.coding': 'Programmierung',
      'subject.science': 'Wissenschaft'
    },
    
    pt: {
      'nav.home': 'Início',
      'nav.chat': 'Tutor AI',
      'nav.code': 'Editor de Código',
      'nav.settings': 'Configurações',
      'chat.placeholder': 'Pergunte-me qualquer coisa...',
      'chat.send': 'Enviar',
      'action.save': 'Salvar',
      'action.cancel': 'Cancelar',
      'settings.title': 'Configurações',
      'settings.language': 'Idioma',
      'auth.login': 'Entrar',
      'auth.logout': 'Sair',
      'subject.math': 'Matemática',
      'subject.coding': 'Programação',
      'subject.science': 'Ciências'
    },
    
    zh: {
      'nav.home': 'Home',
      'nav.chat': 'AI Tutor',
      'nav.code': 'Code Editor',
      'nav.settings': 'Settings',
      'chat.placeholder': 'Ask me anything...',
      'chat.send': 'Send',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'subject.math': 'Mathematics',
      'subject.coding': 'Programming',
      'subject.science': 'Science'
    },
    
    ja: {
      'nav.home': 'Home',
      'nav.chat': 'AI Tutor',
      'nav.code': 'Code Editor',
      'nav.settings': 'Settings',
      'chat.placeholder': 'Ask me anything...',
      'chat.send': 'Send',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'subject.math': 'Mathematics',
      'subject.coding': 'Programming',
      'subject.science': 'Science'
    },
    
    ar: {
      'nav.home': 'Home',
      'nav.chat': 'AI Tutor',
      'nav.code': 'Code Editor',
      'nav.settings': 'Settings',
      'chat.placeholder': 'Ask me anything...',
      'chat.send': 'Send',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'subject.math': 'Mathematics',
      'subject.coding': 'Programming',
      'subject.science': 'Science'
    },
    
    ru: {
      'nav.home': 'Home',
      'nav.chat': 'AI Tutor',
      'nav.code': 'Code Editor',
      'nav.settings': 'Settings',
      'chat.placeholder': 'Ask me anything...',
      'chat.send': 'Send',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'subject.math': 'Mathematics',
      'subject.coding': 'Programming',
      'subject.science': 'Science'
    }
  };

  // Default language
  let currentLanguage = localStorage.getItem('EduAI_language') || 'en';
  let aiResponseLanguage = localStorage.getItem('EduAI_ai_language') || 'same';
  let proficiencyLevel = localStorage.getItem('EduAI_proficiency') || 'intermediate';

  // Get translation
  function t(key, fallback) {
    const lang = translations[currentLanguage] || translations.en;
    const translation = lang[key];
    if (translation) return translation;
    if (fallback) return fallback;
    // Fallback to English
    return translations.en[key] || key;
  }

  // Set language
  function setLanguage(code) {
    if (!translations[code]) {
      console.warn(`Language ${code} not supported, falling back to English`);
      code = 'en';
    }
    currentLanguage = code;
    localStorage.setItem('EduAI_language', code);
    updateAllElements();
    document.documentElement.lang = code;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: code }));
    console.log(`Language set to: ${code}`);
  }

  // Set AI response language
  function setAILanguage(lang) {
    aiResponseLanguage = lang;
    localStorage.setItem('EduAI_ai_language', lang);
  }

  // Get AI language instruction for prompts
  function getAILanguageInstruction() {
    if (aiResponseLanguage === 'same') {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.name || 'English';
      return `Respond in ${langName}.`;
    }
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === aiResponseLanguage)?.name || 'English';
    const level = proficiencyLevel;
    if (level === 'beginner') {
      return `Respond in simple, easy-to-understand ${langName}. Use basic vocabulary and short sentences.`;
    } else if (level === 'advanced') {
      return `Respond in sophisticated ${langName}. Use advanced vocabulary and complex sentence structures.`;
    }
    return `Respond in ${langName}.`;
  }

  // Update all translated elements
  function updateAllElements() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });
  }

  // Get supported languages
  function getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  // Get current language info
  function getCurrentLanguage() {
    return SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  }

  // Export
  window.I18n = {
    t,
    setLanguage,
    setAILanguage,
    getAILanguageInstruction,
    getSupportedLanguages,
    getCurrentLanguage,
    updateAllElements,
    get current() { return currentLanguage; },
    get aiLanguage() { return aiResponseLanguage; },
    get proficiency() { return proficiencyLevel; },
    set proficiency(level) {
      proficiencyLevel = level;
      localStorage.setItem('EduAI_proficiency', level);
    }
  };

  // Initialize on load
  document.documentElement.lang = currentLanguage;
  console.log(`I18n module loaded. Current language: ${currentLanguage}`);
})();
