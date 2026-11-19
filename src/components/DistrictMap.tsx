import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { districtCounts, districtLevel } from '../lib/shelf';
import { BERLIN_MAP_HEIGHT as H, BERLIN_MAP_WIDTH as W, DISTRICT_SHAPES } from '../lib/berlin-map';
import type { Book } from '../types';

const booksUrl = (d: string) => `/books?d=${encodeURIComponent(d)}`;

/** Double-barrelled names break after the hyphen ("Friedrichshain-" / "Kreuzberg"). */
function NameLines({ name }: { name: string }) {
  const i = name.indexOf('-');
  if (i < 0) return <>{name}</>;
  return <>{name.slice(0, i + 1)}<br />{name.slice(i + 1)}</>;
}

/**
 * Berlin's 12 Bezirke drawn from the official boundaries (west on the left even in RTL), shaded by book count.
 * Each district's pin (its count, plus its name when the map is wide enough) is a link to its books, so the map
 * works by keyboard and screen reader; the shapes are clickable too. Hovering or focusing a pin outlines its district.
 */
export function DistrictMap({ books }: { books: Pick<Book, 'neighbourhood'>[] }) {
  const { t, num } = useT();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const counts = districtCounts(books);
  const max = Math.max(0, ...Object.values(counts));
  const shapes = Object.entries(DISTRICT_SHAPES);

  return (
    <div className="berlin-map" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        {shapes.map(([name, s]) => (
          <path key={name} d={s.d} className={`lvl${districtLevel(counts[name], max)}`}
            onClick={() => navigate(booksUrl(name))} onMouseEnter={() => setActive(name)} onMouseLeave={() => setActive(null)} />
        ))}
        {active && <path className="outline" d={DISTRICT_SHAPES[active].d} />}
      </svg>
      {shapes.map(([name, s]) => {
        const n = counts[name];
        return (
          <Link key={name} to={booksUrl(name)} className={`pin${active === name ? ' active' : ''}`}
            style={{ left: `${(s.x / W) * 100}%`, top: `${(s.y / H) * 100}%` }}
            title={name}
            aria-label={`${t('map.open', { d: name })}: ${n === 0 ? t('map.none') : t('books.count', { n })}`}
            onMouseEnter={() => setActive(name)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(name)} onBlur={() => setActive(null)}>
            <span className="pin-count">{num(n)}</span>
            <span className="pin-name" lang="de"><NameLines name={name} /></span>
          </Link>
        );
      })}
    </div>
  );
}
