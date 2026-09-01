'use client';

import type { SiteContent } from '@/lib/content';
import styles from './admin.module.css';

/**
 * The six editors. Each takes the current record and an `update` that produces
 * the next one — all state lives in Dashboard, which owns saving.
 */

type Update = (next: SiteContent) => void;
type EditorProps = { site: SiteContent; update: Update };

/* ── Drink menu ──────────────────────────────────────────────────────────── */

export function DrinksEditor({ site, update }: EditorProps) {
  const setSection = (index: number, patch: Partial<SiteContent['drinks'][number]>) =>
    update({
      ...site,
      drinks: site.drinks.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });

  return (
    <section>
      {site.drinks.map((section, sectionIndex) => (
        <div key={section.id} className={styles.card}>
          <div className={styles.sectionHeadRow}>
            <input
              type="text"
              value={section.title}
              onChange={(e) => setSection(sectionIndex, { title: e.target.value })}
              aria-label="Section title"
              className={styles.sectionTitleInput}
            />
            <input
              type="text"
              value={section.note}
              onChange={(e) => setSection(sectionIndex, { note: e.target.value })}
              placeholder="Section note"
              aria-label="Section note"
              className={styles.sectionNoteInput}
            />
          </div>

          {section.items.map((item, itemIndex) => (
            <div key={itemIndex} className={styles.row}>
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  setSection(sectionIndex, {
                    items: section.items.map((it, i) =>
                      i === itemIndex ? { ...it, name: e.target.value } : it,
                    ),
                  })
                }
                placeholder="Name"
                aria-label="Item name"
                className={`${styles.inputStrong} ${styles.grow2}`}
              />
              <input
                type="text"
                value={item.style}
                onChange={(e) =>
                  setSection(sectionIndex, {
                    items: section.items.map((it, i) =>
                      i === itemIndex ? { ...it, style: e.target.value } : it,
                    ),
                  })
                }
                placeholder="Style"
                aria-label="Item style"
                className={`${styles.input} ${styles.grow3}`}
              />
              <input
                type="text"
                value={item.abv}
                onChange={(e) =>
                  setSection(sectionIndex, {
                    items: section.items.map((it, i) =>
                      i === itemIndex ? { ...it, abv: e.target.value } : it,
                    ),
                  })
                }
                placeholder="ABV"
                aria-label="Item ABV"
                className={`${styles.input} ${styles.abv}`}
              />
              <button
                type="button"
                onClick={() =>
                  setSection(sectionIndex, {
                    items: section.items.filter((_, i) => i !== itemIndex),
                  })
                }
                aria-label={`Remove ${item.name || 'item'}`}
                className={styles.remove}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setSection(sectionIndex, {
                items: [...section.items, { name: '', style: '', abv: '' }],
              })
            }
            className={styles.addBtn}
          >
            Add item
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          update({
            ...site,
            drinks: [
              ...site.drinks,
              { id: `sec_${Date.now()}`, title: 'New section', note: '', items: [] },
            ],
          })
        }
        className={styles.addPrimary}
      >
        Add a menu section
      </button>
    </section>
  );
}

/* ── Food truck ──────────────────────────────────────────────────────────── */

export function FoodEditor({ site, update }: EditorProps) {
  const setFood = (patch: Partial<SiteContent['food']>) =>
    update({ ...site, food: { ...site.food, ...patch } });

  return (
    <section className={styles.card}>
      <div className={styles.stack}>
        <input
          type="text"
          value={site.food.truck}
          onChange={(e) => setFood({ truck: e.target.value })}
          placeholder="Truck name"
          aria-label="Truck name"
          className={styles.truckName}
        />
        <input
          type="text"
          value={site.food.schedule}
          onChange={(e) => setFood({ schedule: e.target.value })}
          placeholder="Schedule"
          aria-label="Schedule"
          className={styles.input}
        />
        <textarea
          rows={3}
          value={site.food.blurb}
          onChange={(e) => setFood({ blurb: e.target.value })}
          placeholder="Blurb"
          aria-label="Blurb"
          className={styles.textarea}
        />
      </div>

      {site.food.items.map((item, index) => (
        <div key={index} className={styles.row}>
          <input
            type="text"
            value={item.name}
            onChange={(e) =>
              setFood({
                items: site.food.items.map((it, i) =>
                  i === index ? { ...it, name: e.target.value } : it,
                ),
              })
            }
            placeholder="Item"
            aria-label="Item name"
            className={`${styles.inputStrong} ${styles.grow2}`}
          />
          <input
            type="text"
            value={item.note}
            onChange={(e) =>
              setFood({
                items: site.food.items.map((it, i) =>
                  i === index ? { ...it, note: e.target.value } : it,
                ),
              })
            }
            placeholder="Description"
            aria-label="Item description"
            className={`${styles.input} ${styles.grow3}`}
          />
          <button
            type="button"
            onClick={() => setFood({ items: site.food.items.filter((_, i) => i !== index) })}
            aria-label={`Remove ${item.name || 'item'}`}
            className={styles.remove}
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setFood({ items: [...site.food.items, { name: '', note: '' }] })}
        className={styles.addBtn}
      >
        Add item
      </button>
    </section>
  );
}

/* ── Hours ───────────────────────────────────────────────────────────────── */

export function HoursEditor({ site, update }: EditorProps) {
  const setHours = (hours: SiteContent['hours']) => update({ ...site, hours });

  return (
    <section className={styles.card}>
      {site.hours.map((row, index) => (
        <div key={index} className={styles.row}>
          <input
            type="text"
            value={row.label}
            onChange={(e) =>
              setHours(
                site.hours.map((h, i) => (i === index ? { ...h, label: e.target.value } : h)),
              )
            }
            placeholder="Days"
            aria-label="Days"
            className={`${styles.inputStrong} ${styles.grow2}`}
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) =>
              setHours(
                site.hours.map((h, i) => (i === index ? { ...h, value: e.target.value } : h)),
              )
            }
            placeholder="Hours"
            aria-label="Hours"
            className={`${styles.input} ${styles.grow2}`}
          />
          <button
            type="button"
            onClick={() => setHours(site.hours.filter((_, i) => i !== index))}
            aria-label={`Remove ${row.label || 'row'}`}
            className={styles.remove}
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setHours([...site.hours, { label: '', value: '' }])}
        className={styles.addBtn}
      >
        Add a row
      </button>
    </section>
  );
}

/* ── Events ──────────────────────────────────────────────────────────────── */

export function EventsEditor({ site, update }: EditorProps) {
  const setEvents = (events: SiteContent['events']) => update({ ...site, events });

  return (
    <section>
      {site.events.map((event, index) => (
        <div key={index} className={styles.eventCard}>
          <div className={styles.row}>
            <input
              type="text"
              value={event.title}
              onChange={(e) =>
                setEvents(
                  site.events.map((ev, i) => (i === index ? { ...ev, title: e.target.value } : ev)),
                )
              }
              placeholder="Event title"
              aria-label="Event title"
              className={styles.eventTitleInput}
            />
            <input
              type="text"
              value={event.date}
              onChange={(e) =>
                setEvents(
                  site.events.map((ev, i) => (i === index ? { ...ev, date: e.target.value } : ev)),
                )
              }
              placeholder="Date"
              aria-label="Date"
              className={styles.eventDateInput}
            />
            <button
              type="button"
              onClick={() => setEvents(site.events.filter((_, i) => i !== index))}
              aria-label={`Remove ${event.title || 'event'}`}
              className={styles.remove}
            >
              ×
            </button>
          </div>
          <textarea
            rows={2}
            value={event.detail}
            onChange={(e) =>
              setEvents(
                site.events.map((ev, i) => (i === index ? { ...ev, detail: e.target.value } : ev)),
              )
            }
            placeholder="Details"
            aria-label="Event details"
            className={styles.textarea}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setEvents([...site.events, { title: '', date: '', detail: '' }])}
        className={styles.addPrimary}
      >
        Add an event
      </button>
    </section>
  );
}

/* ── Banner ──────────────────────────────────────────────────────────────── */

export function BannerEditor({ site, update }: EditorProps) {
  const setAnnouncement = (patch: Partial<SiteContent['announcement']>) =>
    update({ ...site, announcement: { ...site.announcement, ...patch } });

  const showsOnSite = site.announcement.enabled && site.announcement.text.trim().length > 0;

  return (
    <section className={styles.card}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={site.announcement.enabled}
          onChange={(e) => setAnnouncement({ enabled: e.target.checked })}
          className={styles.checkbox}
        />
        Show the banner on every page
      </label>

      <input
        type="text"
        value={site.announcement.text}
        onChange={(e) => setAnnouncement({ text: e.target.value })}
        placeholder="Announcement text"
        aria-label="Announcement text"
        className={styles.bannerInput}
      />

      <p className={styles.previewLabel}>
        {showsOnSite ? 'Preview' : 'Preview — not currently shown on the site'}
      </p>
      <div className={styles.bannerPreview} aria-hidden="true">
        {site.announcement.text}
      </div>
    </section>
  );
}
