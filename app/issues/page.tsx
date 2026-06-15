import { db } from "@/db";
import { issues as issuesT } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AppNav } from "@/components/AppNav";
import { publishFromIssue, deleteIssue } from "./actions";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const list = await db.select().from(issuesT).orderBy(desc(issuesT.id));
  return (
    <>
      <AppNav active="/issues" />
      <div className="screen">
        <h1>Броеве</h1>
        <a href="/composer" className="btn" style={{ display: "inline-block", marginBottom: 18 }}>
          + Нов брой
        </a>

        <div className="issues">
          {list.length === 0 && (
            <p style={{ color: "var(--muted)" }}>Още няма запазени броеве.</p>
          )}
          {list.map((i) => (
            <div className="issue-row" key={i.id}>
              <div>
                <b>Брой №{i.number}</b>
                <small>
                  {i.periodFrom} – {i.periodTo}
                </small>
              </div>
              <div className="actions">
                <a className="btn-light" href={`/composer?issue=${i.id}`}>
                  Отвори
                </a>
                <form action={publishFromIssue.bind(null, i.id)}>
                  <button className="btn" type="submit">
                    Публикувай като нов
                  </button>
                </form>
                <form action={deleteIssue.bind(null, i.id)}>
                  <button className="btn-danger" type="submit">
                    Изтрий
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
