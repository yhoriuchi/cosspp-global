import { useEffect, useState } from 'react';
import type { Faculty } from '../types/faculty';
export function ProfileChangeRequest({ person }: { person: Faculty }) {
  const [api, setApi] = useState('');
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [text, setText] = useState('');
  const [biography, setBiography] = useState('');
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}site-config.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        if (active && typeof config?.profileRequestsApi === 'string') {
          const url = new URL(config.profileRequestsApi);
          if (url.protocol === 'https:') setApi(url.origin);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function send(path: string, body: object) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(api + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again later.');
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again later.');
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="profile-section change-request" aria-labelledby="change-request-title">
      <h2 id="change-request-title">Request a profile change</h2>
      {!api ? (
        <p className="muted">
          Verified change requests are being prepared and are not available yet. For now, please
          keep your official faculty page or public CV up to date.
        </p>
      ) : !person.email ? (
        <p className="muted">
          This profile needs a source-verified FSU email address before online change requests can
          be enabled.
        </p>
      ) : done ? (
        <p role="status">{message}</p>
      ) : (
        <>
          <p>
            Verify the FSU email listed for this profile. Requests are saved privately on GitHub;
            this service does not email the site administrator.
          </p>
          {!challenge ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const data = await send('/challenge', { profile_id: person.id, email });
                if (data) {
                  setChallenge(data.challenge_id);
                  setMessage(data.message);
                }
              }}
            >
              <label>
                Step 1 — Your FSU email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy}
                />
              </label>
              <button className="button" disabled={busy}>
                {busy ? 'Sending…' : 'Send passcode'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const data = await send('/requests', {
                  challenge_id: challenge,
                  passcode: code,
                  request_text: text,
                  proposed_biography: publish ? biography : '',
                  publish_biography: publish,
                });
                if (data) {
                  setDone(true);
                  setMessage(data.message);
                  setCode('');
                  setText('');
                  setBiography('');
                }
              }}
            >
              <label>
                Step 2 — Passcode
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Requested change
                <textarea
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  disabled={busy}
                />
              </label>
              <p className="small muted">
                Describe the change and include public source links when relevant. Do not include
                passwords or sensitive personal information. General requests are saved for review.
              </p>
              <label className="appointment-toggle">
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(event) => setPublish(event.target.checked)}
                  disabled={busy}
                />
                <span>I also want to replace my research summary with the text below.</span>
              </label>
              {publish && (
                <>
                  <label>
                    Research summary to publish
                    <textarea
                      required
                      minLength={20}
                      maxLength={1200}
                      rows={4}
                      value={biography}
                      onChange={(event) => setBiography(event.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <p className="small muted">
                    This text is intended for public display and can be applied automatically after
                    validation. Other profile fields are not changed automatically by this form.
                  </p>
                </>
              )}
              <button className="button" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit verified request'}
              </button>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setChallenge('');
                  setCode('');
                  setMessage('');
                }}
              >
                Request a new passcode
              </button>
            </form>
          )}
          {message && <p role="status">{message}</p>}
        </>
      )}
    </section>
  );
}
