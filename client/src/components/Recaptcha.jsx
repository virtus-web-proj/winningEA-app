import { useEffect, useRef } from 'react';

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_ID = 'google-recaptcha-v2';

export default function Recaptcha({ onChange }) {
  const target = useRef(null);
  const widget = useRef(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  useEffect(() => {
    if (!siteKey) return undefined;
    const render = () => {
      if (!target.current || widget.current !== null || !window.grecaptcha) return;
      widget.current = window.grecaptcha.render(target.current, {
        sitekey: siteKey,
        callback: (token) => changeRef.current(token),
        'expired-callback': () => changeRef.current(''),
        'error-callback': () => changeRef.current(''),
      });
    };
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      window.grecaptcha ? window.grecaptcha.ready(render) : existing.addEventListener('load', render, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true; script.defer = true; script.addEventListener('load', () => window.grecaptcha.ready(render), { once: true });
      document.head.appendChild(script);
    }
    return () => changeRef.current('');
  }, []);

  return siteKey ? <div ref={target} className="min-h-[78px]" /> : null;
}
