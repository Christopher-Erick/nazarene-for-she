import Image from "next/image";
import { initials, type LeadershipMember } from "@/lib/cms/leadership";

/**
 * Leadership team on Why We Exist: portrait, title, name and what each person does.
 * Uploaded portraits are already shrunk in the admin and served from /api/v1/public/media, which the
 * image resizer cannot read, so those are shown as uploaded.
 */
export function LeadershipTeam({ members, intro }: { members: LeadershipMember[]; intro: string }) {
  if (!members.length) return null;
  return (
    <section id="leadership" className="leadership mt-24" aria-labelledby="leadership-title">
      <div className="leadership__head">
        <p className="eyebrow text-accent">Leadership</p>
        <h2 id="leadership-title" className="display-md mt-3">
          The people who walk with her
        </h2>
        {intro ? <p className="mt-4 max-w-2xl text-lg text-muted">{intro}</p> : null}
      </div>

      <ul className="leadership__grid" data-count={Math.min(members.length, 3)}>
        {members.map((member, index) => (
          <li key={member.id} className="leader-card">
            <figure className="leader-card__portrait">
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={member.photoAlt || `Portrait of ${member.name}`}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  unoptimized={member.photo.startsWith("/api/")}
                  className="leader-card__photo"
                />
              ) : (
                <span className="leader-card__monogram" aria-hidden="true">
                  {initials(member.name)}
                </span>
              )}
              <span className="leader-card__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
            </figure>
            <div className="leader-card__body">
              {member.title ? <p className="leader-card__title">{member.title}</p> : null}
              <h3 className="leader-card__name font-display">{member.name}</h3>
              <span className="leader-card__thread" aria-hidden="true" />
              {member.bio ? <p className="leader-card__bio">{member.bio}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
