"use client";

import { useParams } from "next/navigation";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { EventEditor } from "@/components/admin/EventEditor";
import { ProgramEditor } from "@/components/admin/ProgramEditor";
import { SitePageEditor } from "@/components/admin/SitePageEditor";
import { StoryEditor } from "@/components/admin/StoryEditor";

export default function ContentEditorPage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params.type;
  const id = params.id;

  if (type === "atelier") return <CategoryEditor id={id} />;
  if (type === "events") return <EventEditor id={id} />;
  if (type === "stories") return <StoryEditor id={id} />;
  if (type === "programs") return <ProgramEditor id={id} />;
  if (type === "pages") return <SitePageEditor id={id} />;

  return <p className="admin-flash admin-flash--error">That part of the site is not edited here.</p>;
}
