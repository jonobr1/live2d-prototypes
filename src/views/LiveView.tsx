/**
 * 
 */
export default function ListView({
  views,
}: {
  views?: { name: string; href: string }[];
}) {
  return (<div className="view list-view">
    <ul>
      {
        views && views.map(({ name, href }, i) => (
          <li key={i}><a href={href}>{ name }</a></li>
        ))
      }
    </ul>
  </div>);
}
