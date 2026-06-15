export function AppNav({ active }: { active: string }) {
  const Link = ({ href, label }: { href: string; label: string }) => (
    <a href={href} className={active === href ? "active" : ""}>
      {label}
    </a>
  );
  return (
    <nav className="appnav">
      <div className="appnav__brand">
        Аптека <b>Атифарм</b>
      </div>
      <Link href="/composer" label="Нов брой" />
      <Link href="/issues" label="Броеве" />
      <Link href="/products" label="Продукти" />
      <Link href="/settings" label="Настройки" />
      <form action="/api/logout" method="post" className="appnav__out">
        <button type="submit">Изход</button>
      </form>
    </nav>
  );
}
