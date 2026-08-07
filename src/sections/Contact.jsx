import { useState } from 'react';
import Reveal from '../components/Reveal';

const STUDIO_EMAIL = 'hello@klevonlabs.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Three fields, because a project enquiry needs three things: who, how to
 * reply, and what it is.
 *
 * There is no backend on this build, so submit hands off to the studio's mail
 * client with the enquiry prefilled. That genuinely delivers rather than
 * pretending to, and swapping in a real endpoint means replacing the body of
 * handleSubmit.
 */
export default function Contact() {
  const [values, setValues] = useState({ name: '', email: '', project: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Tell us who you are.';
    if (!values.email.trim()) next.email = 'We need somewhere to reply.';
    else if (!EMAIL_RE.test(values.email.trim()))
      next.email = 'That address looks incomplete.';
    if (!values.project.trim()) next.project = 'One line is enough.';
    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('sending');
    const subject = `Project enquiry from ${values.name.trim()}`;
    const body = `${values.project.trim()}\n\n${values.name.trim()}\n${values.email.trim()}`;
    window.location.href = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setStatus('sent');
  };

  const field = (name, label, type = 'text') => (
    <div className="field">
      <label className="field-label mono" htmlFor={name}>
        {label}
      </label>
      <input
        className="field-input"
        id={name}
        name={name}
        type={type}
        value={values[name]}
        onChange={update(name)}
        aria-invalid={errors[name] ? 'true' : undefined}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        autoComplete={
          name === 'name' ? 'name' : name === 'email' ? 'email' : 'off'
        }
      />
      {errors[name] && (
        <p className="field-error" id={`${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <section className="section contact" id="contact">
      <div className="shell contact-grid">
        <Reveal>
          <h2 className="contact-title">
            Have a project worth building properly?
            <br />
            <span className="contact-title-2">Let us talk.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="contact-form-wrap">
          {status === 'sent' ? (
            <div className="contact-sent" role="status">
              <p className="contact-sent-line">Your mail client is open.</p>
              <p className="contact-sent-sub">
                If nothing happened, write to{' '}
                <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a> directly.
              </p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              {field('name', 'Name')}
              {field('email', 'Email', 'email')}
              {field('project', 'The project, in one line')}
              <button
                className="submit"
                type="submit"
                disabled={status === 'sending'}
              >
                <span className="submit-label">
                  {status === 'sending' ? 'Opening mail' : 'Start a project'}
                </span>
                <span className="submit-rule" aria-hidden="true" />
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
