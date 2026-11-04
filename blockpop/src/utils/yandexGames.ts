import { sound } from './audio';

export interface YandexPlayer {
  getName(): string;
  getPhoto(size: 'small' | 'medium' | 'large'): string;
  getUniqueID(): string;
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
  getData(keys?: string[]): Promise<Record<string, unknown>>;
  setStats(stats: Record<string, number>): Promise<void>;
  getStats(keys?: string[]): Promise<Record<string, number>>;
  incrementStats(increments: Record<string, number>): Promise<Record<string, number>>;
}

export interface YandexLeaderboards {
  getLeaderboardDescription(leaderboardName: string): Promise<{
    app: { id: string };
    name: string;
    title: { [lang: string]: string };
  }>;
  setLeaderboardScore(leaderboardName: string, score: number, extraData?: string): Promise<void>;
  getLeaderboardPlayerEntry(leaderboardName: string): Promise<unknown>;
  getLeaderboardEntries(leaderboardName: string, options?: unknown): Promise<unknown>;
}

export interface YandexSDK {
  environment: {
    app: { id: string };
    browser: { lang: string };
    i18n: { lang: string; t: (key: string) => string };
  };
  deviceInfo: {
    type: string;
    isMobile(): boolean;
    isTablet(): boolean;
    isDesktop(): boolean;
    isTV(): boolean;
  };
  features: {
    LoadingAPI?: {
      ready(): void;
    };
    GameplayAPI?: {
      start(): void;
      stop(): void;
    };
  };
  adv: {
    showFullscreenAdv(options: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: unknown) => void;
        onOffline?: () => void;
      };
    }): void;
    showRewardedVideo(options: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: () => void;
        onError?: (error: unknown) => void;
      };
    }): void;
  };
  auth: {
    openAuthDialog(): Promise<void>;
  };
  on(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
  off(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
  getPlayer(options?: { scopes?: boolean }): Promise<YandexPlayer>;
  getLeaderboards(): Promise<YandexLeaderboards>;
  feedback?: {
    canReview(): Promise<{ value: boolean; reason?: string }>;
    requestReview(): Promise<{ value: boolean }>;
  };
  shortcut?: {
    canShowPrompt(): Promise<{ canShow: boolean }>;
    showPrompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
}

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<YandexSDK>;
    };
    ysdk?: YandexSDK;
  }
}

class YandexGamesService {
  private ysdk: YandexSDK | null = null;
  private player: YandexPlayer | null = null;
  private leaderboards: YandexLeaderboards | null = null;
  private initialized = false;
  private isPlayerAuthorized = false;
  private playerName = '';
  private lastFullscreenTime = 0;
  private readonly FULLSCREEN_COOLDOWN_MS = 65000;
  private isPaused = false;
  private onPauseCallbacks: Set<(paused: boolean) => void> = new Set();

  public isAvailable(): boolean {
    return !!this.ysdk;
  }

  public getSDK(): YandexSDK | null {
    return this.ysdk;
  }

  public getIsAuthorized(): boolean {
    return this.isPlayerAuthorized;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public onPauseChange(cb: (paused: boolean) => void) {
    this.onPauseCallbacks.add(cb);
    return () => {
      this.onPauseCallbacks.delete(cb);
    };
  }

  private notifyPause(paused: boolean) {
    this.isPaused = paused;
    this.onPauseCallbacks.forEach((cb) => cb(paused));
  }

  /**
   * Initializes Yandex SDK, registers LoadingAPI.ready(),
   * registers focus & visibility listeners for Section 1.3 compliance,
   * listens to game_api_pause/resume for Section 1.19.4 compliance.
   */
  public async init(): Promise<{ bestScore?: number; lang: string }> {
    if (this.initialized) return { lang: this.getLang() };

    // Register visibility and focus listeners (Section 1.3: audio stops on focus loss)
    if (typeof window !== 'undefined') {
      const handleFocusLoss = () => {
        sound.setAdMute(true);
        this.notifyPause(true);
      };

      const handleFocusGain = () => {
        sound.setAdMute(false);
      };

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          handleFocusLoss();
        } else {
          handleFocusGain();
        }
      });

      window.addEventListener('blur', handleFocusLoss);
      window.addEventListener('focus', handleFocusGain);
    }

    try {
      if (typeof window !== 'undefined' && window.YaGames) {
        const ysdk = await window.YaGames.init();
        this.ysdk = ysdk;
        window.ysdk = ysdk;

        // Section 1.19.2: Call LoadingAPI.ready() when game is loaded
        if (ysdk.features.LoadingAPI) {
          ysdk.features.LoadingAPI.ready();
        }

        // Section 1.19.4: Handle game_api_pause and game_api_resume
        if (typeof ysdk.on === 'function') {
          ysdk.on('game_api_pause', () => {
            sound.setAdMute(true);
            this.notifyPause(true);
          });
          ysdk.on('game_api_resume', () => {
            sound.setAdMute(false);
            this.notifyPause(false);
          });
        }

        // Initialize Player in guest mode by default (Sections 1.2.1, 1.2.2)
        await this.refreshPlayerInfo();

        // Initialize Leaderboards
        try {
          this.leaderboards = await ysdk.getLeaderboards();
        } catch {
          // Leaderboards might not be configured yet in dev console
        }

        // Load highscore from cloud if available
        let cloudBest: number | undefined;
        if (this.player) {
          try {
            const data = await this.player.getData(['best_score', 'bestScore']);
            const val = data.best_score ?? data.bestScore;
            if (typeof val === 'number') {
              cloudBest = val;
            }
          } catch {
            // Ignore fetch error
          }
        }

        this.initialized = true;
        return { bestScore: cloudBest, lang: this.getLang() };
      }
    } catch (err) {
      console.warn('Yandex Games SDK running in standalone/dev mode', err);
    }

    this.initialized = true;
    return { lang: this.getLang() };
  }

  /**
   * Refreshes player authorization state and retrieves user profile
   */
  public async refreshPlayerInfo(): Promise<boolean> {
    if (!this.ysdk) return false;
    try {
      this.player = await this.ysdk.getPlayer({ scopes: false });
      const uniqueId = this.player.getUniqueID();
      if (uniqueId) {
        this.isPlayerAuthorized = true;
        this.playerName = this.player.getName() || 'Игрок';
        return true;
      }
    } catch {
      this.isPlayerAuthorized = false;
      this.playerName = '';
    }
    return false;
  }

  /**
   * Explicit user-triggered login request (Section 1.2.1)
   */
  public async requestAuth(): Promise<{ success: boolean; bestScore?: number }> {
    if (!this.ysdk) return { success: false };

    try {
      await this.ysdk.auth.openAuthDialog();
      const authorized = await this.refreshPlayerInfo();

      let cloudBest: number | undefined;
      if (authorized && this.player) {
        const data = await this.player.getData(['best_score', 'bestScore']);
        const val = data.best_score ?? data.bestScore;
        if (typeof val === 'number') {
          cloudBest = val;
        }
      }

      return { success: authorized, bestScore: cloudBest };
    } catch (e) {
      console.warn('User rejected or cancelled auth dialog', e);
      return { success: false };
    }
  }

  /**
   * Notifies Yandex Games of gameplay session start
   */
  public gameplayStart() {
    try {
      this.ysdk?.features.GameplayAPI?.start();
    } catch {
      // safe fallback
    }
  }

  /**
   * Notifies Yandex Games of gameplay session stop
   */
  public gameplayStop() {
    try {
      this.ysdk?.features.GameplayAPI?.stop();
    } catch {
      // safe fallback
    }
  }

  /**
   * Shows standard interstitial fullscreen ad.
   * Respects cooldown so user is never bombarded with ads.
   * Mutes game audio and pauses game during display (Section 4.7).
   */
  public showFullscreenAd(force: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      const now = Date.now();
      if (!force && now - this.lastFullscreenTime < this.FULLSCREEN_COOLDOWN_MS) {
        resolve(false);
        return;
      }

      if (!this.ysdk) {
        resolve(false);
        return;
      }

      this.lastFullscreenTime = now;
      sound.setAdMute(true);
      this.gameplayStop();

      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            sound.setAdMute(true);
          },
          onClose: (wasShown) => {
            sound.setAdMute(false);
            this.gameplayStart();
            resolve(wasShown);
          },
          onError: () => {
            sound.setAdMute(false);
            this.gameplayStart();
            resolve(false);
          },
          onOffline: () => {
            sound.setAdMute(false);
            this.gameplayStart();
            resolve(false);
          },
        },
      });
    });
  }

  /**
   * Shows rewarded video ad.
   * Calls onRewarded ONLY when user completely finishes watching the video (Section 4.5).
   * Safely pauses and resumes game audio (Section 4.7).
   */
  public showRewardAd(onRewarded: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.ysdk) {
        // Dev fallback
        onRewarded();
        resolve(true);
        return;
      }

      sound.setAdMute(true);
      this.gameplayStop();
      let rewardEarned = false;

      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {
            sound.setAdMute(true);
          },
          onRewarded: () => {
            rewardEarned = true;
            onRewarded();
          },
          onClose: () => {
            sound.setAdMute(false);
            this.gameplayStart();
            resolve(rewardEarned);
          },
          onError: () => {
            sound.setAdMute(false);
            this.gameplayStart();
            resolve(false);
          },
        },
      });
    });
  }

  /**
   * Saves highscore to Yandex Cloud Player Data and Leaderboards
   */
  public async saveScore(score: number): Promise<void> {
    // 1. Save to Yandex Player Cloud
    if (this.player) {
      try {
        await this.player.setData({ best_score: score }, true);
      } catch {
        // Player might be guest or offline
      }
    }

    // 2. Submit to Yandex Leaderboard
    if (this.leaderboards) {
      try {
        await this.leaderboards.setLeaderboardScore('best_score', score);
      } catch {
        try {
          await this.leaderboards.setLeaderboardScore('score', score);
        } catch {
          // Leaderboard not configured
        }
      }
    }
  }

  /**
   * Prompts user to rate/review the game on Yandex Games
   */
  public async promptReview(): Promise<boolean> {
    if (!this.ysdk?.feedback) return false;
    try {
      const can = await this.ysdk.feedback.canReview();
      if (can.value) {
        const res = await this.ysdk.feedback.requestReview();
        return res.value;
      }
    } catch {
      // Ignored
    }
    return false;
  }

  /**
   * Returns current user language ('ru' | 'en') (Section 2.14)
   * Strictly adheres to Yandex Games SDK environment with URL query and browser fallbacks
   */
  public getLang(): 'ru' | 'en' {
    // 1. Check URL query ?lang=en or ?lang=ru (frequently used by Yandex Games moderators)
    if (typeof window !== 'undefined' && window.location?.search) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang) {
          const l = urlLang.toLowerCase();
          return (l.startsWith('ru') || l.startsWith('be') || l.startsWith('kk') || l.startsWith('uk')) ? 'ru' : 'en';
        }
      } catch {
        // Safe fallback
      }
    }

    // 2. Check Yandex Games SDK environment i18n
    const sdkLang = this.ysdk?.environment?.i18n?.lang || this.ysdk?.environment?.browser?.lang;
    if (sdkLang) {
      const normalized = sdkLang.toLowerCase();
      return (normalized.startsWith('ru') || normalized.startsWith('be') || normalized.startsWith('kk') || normalized.startsWith('uk')) ? 'ru' : 'en';
    }

    // 3. Check saved language preference in localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('blockpop_lang') || localStorage.getItem('blockblast_lang');
      if (saved === 'ru' || saved === 'en') return saved;
    }

    // 4. Browser language fallback
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.toLowerCase();
      return (navLang.startsWith('ru') || navLang.startsWith('be') || navLang.startsWith('kk') || navLang.startsWith('uk')) ? 'ru' : 'en';
    }

    return 'ru';
  }
}

export const yandex = new YandexGamesService();
