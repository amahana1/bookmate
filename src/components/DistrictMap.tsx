import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { districtCounts, districtLevel, rankDistricts } from '../lib/shelf';
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
 * Berlin's 12 Bezirke drawn from the official boundaries (west on the left even in RTL), shaded by book count,
 * with the count written on each district. The map is for pointer users; the ranked list beside it carries the
 * same links for keyboard and screen-reader users, and hovering or focusing either one highlights the other.
 */
export function DistrictMap({ books }: { books: Pick<Book, 'neighbourhood'>[] }) {
  const { t, num } = useT();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const counts = districtCounts(books);
  const max = Math.max(0, ...Object.values(counts));
  const shapes = Object.entries(DISTRICT_SHAPES);
  const pointer = (name: string) => ({
    onClick: () => navigate(booksUrl(name)),
    onMouseEnter: () => setActive(name),
    onMouseLeave: () => setActive(null),
  });

  return (
    <div className="berlin">
      <div className="berlin-map" dir="ltr" aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} focusable="false">
          {shapes.map(([name, s]) => (
            <path key={name} d={s.d} className={`lvl${districtLevel(counts[name], max)}`} {...pointer(name)} />
          ))}
          {active && <path className="outline" d={DISTRICT_SHAPES[active].d} />}
        </svg>
        {shapes.map(([name, s]) => (
          <span key={name} className={`pin${active === name ? ' active' : ''}`}
            style={{ left: `${(s.x / W) * 100}%`, top: `${(s.y / H) * 100}%` }} {...pointer(name)}>
            <span className="pin-count">{num(counts[name])}</span>
            <span className="pin-name" lang="de"><NameLines name={name} /></span>
          </span>
        ))}
      </div>

      <div className="district-list-wrap">
        <h3 className="district-list-title">{t('map.listTitle')}</h3>
        <ol className="district-list">
          {rankDistricts(counts).map(({ name, count }) => (
            <li key={name}>
              <Link to={booksUrl(name)} className={active === name ? 'active' : undefined}
                onMouseEnter={() => setActive(name)} onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(name)} onBlur={() => setActive(null)}
                aria-label={`${t('map.open', { d: name })}: ${count === 0 ? t('map.none') : t('books.count', { n: count })}`}>
                <span className={`swatch lvl${districtLevel(count, max)}`} aria-hidden="true" />
                <span className="name"><bdi lang="de">{name}</bdi></span>
                <span className="count">{num(count)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
