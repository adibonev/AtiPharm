import { lev, eurStr, levStr, pctOf, DISCLAIMERS, periodShort, unitLabel } from "@/lib/pricing";
import type { IssueData, CardProduct, FeaturedProduct, ProductType } from "@/lib/types";

type Disclaimers = Partial<Record<ProductType, string>>;

function Price({ p }: { p: CardProduct }) {
  if (p.percentOnly) {
    return (
      <div className="price">
        <div className="pct">
          <b>-{p.percent}%</b>
          <span>отстъпка</span>
        </div>
      </div>
    );
  }
  if (p.lowPrice) {
    return (
      <div className="price">
        <div className="low-label">Трайно ниска цена</div>
        <div className="now low">
          {eurStr(p.newEur!)} <i>|</i> <span className="lv">{levStr(lev(p.newEur!))}</span>
        </div>
        <span className="unit">{unitLabel(p.priceUnit)}</span>
      </div>
    );
  }
  return (
    <div className="price">
      <div className="old strike">
        {eurStr(p.oldEur!)} | {levStr(lev(p.oldEur!))}
      </div>
      <div className="now">
        {eurStr(p.newEur!)} <i>|</i> <span className="lv">{levStr(lev(p.newEur!))}</span>
      </div>
      <span className="unit">{unitLabel(p.priceUnit)}</span>
    </div>
  );
}

function Card({
  p,
  period,
  disclaimers,
}: {
  p: CardProduct;
  period: string;
  disclaimers: Disclaimers;
}) {
  return (
    <article className={`card ${p.percentOnly ? "only" : ""}`}>
      <div className="card__media">
        {!p.percentOnly && !p.lowPrice && (
          <span className="ribbon ribbon--card">-{pctOf(p.oldEur!, p.newEur!)}%</span>
        )}
        <img src={p.img} alt={p.name} />
      </div>
      <div className="card__body">
        <h3>{p.name}</h3>
        <p className="sub">{p.sub}</p>
        <Price p={p} />
        <div className="card__foot">
          <span className="period-tag">{periodShort(period)}</span>
          <p className="disc">{disclaimers[p.type] || ""}</p>
        </div>
      </div>
    </article>
  );
}

function SlimFooter({ issue }: { issue: IssueData }) {
  const c = issue.contacts;
  return (
    <footer className="foot--slim">
      <span>
        <b>Аптека Атифарм</b>
        <span className="sep">·</span>
        {c.address}
      </span>
      <span>
        {c.phone}
        <span className="sep">·</span>FB: {c.facebook}
        <span className="sep">·</span>
        {c.hours}
      </span>
    </footer>
  );
}

function Cover({
  issue,
  featured,
  disclaimers,
}: {
  issue: IssueData;
  featured: FeaturedProduct;
  disclaimers: Disclaimers;
}) {
  const f = featured;
  return (
    <section className="page cover">
      <div className="page__safe">
        <div className="cv-mast">
          <div className="logo-pill">
            <img src="/logo.png" alt="Аптека Атифарм" />
          </div>
          <div className="cv-issue">
            <div className="no">{issue.no}</div>
            <span className="period">{issue.period}</span>
          </div>
        </div>

        <div className="cv-center">
          <div className="cv-kicker">Акцент на броя</div>
          <div className="cv-hero">
            <div className="cv-card">
              {!f.percentOnly && !f.lowPrice && (
                <span className="ribbon">-{pctOf(f.oldEur!, f.newEur!)}%</span>
              )}
              <img src={f.img} alt={f.name} />
            </div>
            <div className="cv-body">
              {f.tag && <span className="cv-tag">{f.tag}</span>}
              <h1>{f.name}</h1>
              <p className="sub">{f.sub}</p>
              <div className="cv-price">
                {f.percentOnly ? (
                  <>
                    <div className="now">-{f.percent}%</div>
                    <span className="unit">отстъпка</span>
                  </>
                ) : f.lowPrice ? (
                  <>
                    <div className="low-label">Трайно ниска цена</div>
                    <div className="now low">
                      {eurStr(f.newEur!)} <i>|</i>{" "}
                      <span className="lv">{levStr(lev(f.newEur!))}</span>
                    </div>
                    <span className="unit">{f.unitNote}</span>
                  </>
                ) : (
                  <>
                    <div className="old strike">
                      {eurStr(f.oldEur!)} | {levStr(lev(f.oldEur!))}
                    </div>
                    <div className="now">
                      {eurStr(f.newEur!)} <i>|</i>{" "}
                      <span className="lv">{levStr(lev(f.newEur!))}</span>
                    </div>
                    <span className="unit">{f.unitNote}</span>
                  </>
                )}
              </div>
              <div className="cv-meta">
                <span className="cv-period">Промоция {issue.period}</span>
              </div>
              <p className="cv-disc" style={{ marginTop: 10 }}>
                {disclaimers[f.type] || ""}
              </p>
            </div>
          </div>
        </div>

        <div className="cv-foot">
          <p className="cv-slogan">„{issue.slogan}"</p>
          <div className="cv-contacts">
            <div>
              <h4>Адрес</h4>
              <p>{issue.contacts.address}</p>
            </div>
            <div>
              <h4>Телефон · Facebook</h4>
              <p>
                {issue.contacts.phone} · {issue.contacts.facebook}
              </p>
            </div>
            <div>
              <h4>Работно време</h4>
              <p
                dangerouslySetInnerHTML={{
                  __html: issue.contacts.hours.replace(" · ", "<br/>"),
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Brochure({
  issue,
  featured,
  products,
  disclaimers = DISCLAIMERS,
}: {
  issue: IssueData;
  featured: FeaturedProduct;
  products: CardProduct[];
  disclaimers?: Disclaimers;
}) {
  // Few products -> fewer, larger cards per page (spec §5).
  const big = products.length <= 7;
  const perPage = big ? 4 : 6;
  const pages = Math.max(1, Math.ceil(products.length / perPage));
  return (
    <>
      <Cover issue={issue} featured={featured} disclaimers={disclaimers} />
      {Array.from({ length: pages }).map((_, i) => {
        const slice = products.slice(i * perPage, (i + 1) * perPage);
        const fill = slice.length === perPage; // full page -> distribute rows to fill the sheet
        return (
          <section className="page page--products" key={i}>
            <div className="page__safe">
              <header className="page-head">
                <img src="/logo.png" alt="Аптека Атифарм" />
                <div className="meta">
                  {issue.no} · <b>{issue.period}</b>
                </div>
              </header>
              <div className={`grid ${big ? "grid--big" : ""} ${fill ? "grid--fill" : ""}`}>
                {slice.map((p, j) => (
                  <Card key={j} p={p} period={issue.period} disclaimers={disclaimers} />
                ))}
              </div>
            </div>
            <SlimFooter issue={issue} />
          </section>
        );
      })}
    </>
  );
}
