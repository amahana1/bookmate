import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { BEZIRKE } from '../lib/berlin';
import { DISTRICT_TILES, districtCounts } from '../lib/shelf';
import type { Book } from '../types';

/** The 12 Bezirke on a geographic tile grid (west on the left even in RTL); shade + written count per district. */
export function DistrictMap({ books }: { books: Pick<Book, 'neighbourhood'>[] }) {
  const { t } = useT();
  const counts = districtCounts(books);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div dir="ltr" className="district-map">
      {BEZIRKE.map((d) => {
        const n = counts[d];
        const lvl = n === 0 ? 0 : n >= max * 0.66 ? 3 : n >= max * 0.33 ? 2 : 1;
        const pos = DISTRICT_TILES[d];
        const countText = n === 0 ? t('map.none') : t('books.count', { n });
        return (
          <Link
            key={d}
            to={`/books?d=${encodeURIComponent(d)}`}
            className={`district lvl${lvl}`}
            style={{ gridColumn: pos.col, gridRow: pos.row, ['--order' as string]: String(-n) }}
            aria-label={`${t('map.open', { d })}: ${countText}`}
          >
            <span className="name" lang="de">{d}</span>
            <span className="count" dir="auto">{countText}</span>
          </Link>
        );
      })}
    </div>
  );
}
