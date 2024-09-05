import cn from 'classnames';

import styles from './ListView.module.css';

/**
 *
 */
export default function View({
  views,
}: {
  views?: { name: string; href: string }[];
}) {
  return (
    <div className={cn(styles.view)}>
      <ol className="list-decimal">
        {views &&
          views.map(({ name, href }, i) => (
            <li key={i}>
              <a
                className="underline hover:no-underline"
                href={href}
                onClick={() =>
                  requestAnimationFrame(() => window.location.reload())
                }
              >
                {name}
              </a>
            </li>
          ))}
      </ol>
    </div>
  );
}
