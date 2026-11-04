import { useCallback, useEffect, useRef } from 'react';

import moodIcon from '../assets/mood-icon.png';

const MOOD_URL = 'https://mood-app.ru/';
const MOOD_ORIGIN = 'https://mood-app.ru';
const CLOSE_MESSAGE = 'mood:close-game';
const CLOSE_ACK = 'mood:close-game-ack';

/** Игра открыта внутри iframe, а не отдельной вкладкой. */
function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Доступ к window.top запрещён — значит, мы точно в чужом контексте.
    return true;
  }
}

/**
 * Маленькая кнопка возврата в Mood внизу игры.
 *
 * В iframe она просит родителя закрыть оверлей через postMessage. Если родитель
 * ещё не умеет обрабатывать сообщение, через короткую задержку открываем Mood
 * в новой вкладке — кнопка не должна быть «мёртвой». При прямом заходе просто
 * переходим на главную Mood.
 */
export function MoodBackButton() {
  const ackTimer = useRef<number | null>(null);

  const clearAckTimer = useCallback(() => {
    if (ackTimer.current !== null) {
      window.clearTimeout(ackTimer.current);
      ackTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== MOOD_ORIGIN) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === CLOSE_ACK) clearAckTimer();
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearAckTimer();
    };
  }, [clearAckTimer]);

  const handleClick = useCallback(() => {
    if (!isEmbedded()) {
      window.location.assign(MOOD_URL);
      return;
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      window.parent.postMessage(
        { type: CLOSE_MESSAGE, source: 'block-blast', requestId },
        MOOD_ORIGIN,
      );
    } catch {
      // Родитель недоступен — сработает запасной вариант ниже.
    }

    clearAckTimer();
    ackTimer.current = window.setTimeout(() => {
      ackTimer.current = null;
      window.open(MOOD_URL, '_blank', 'noopener,noreferrer');
    }, 350);
  }, [clearAckTimer]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Вернуться в Mood"
      title="Вернуться в Mood"
      className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold leading-none text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white active:scale-[0.97]"
      style={{ touchAction: 'manipulation' }}
    >
      <img
        src={moodIcon}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 rounded-[4px]"
        draggable={false}
      />
      <span>Вернуться в Mood</span>
    </button>
  );
}
