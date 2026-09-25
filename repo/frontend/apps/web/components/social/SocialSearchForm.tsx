"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { SocialSearchFormProps } from "@/types/components/social";
import s from "./Social.module.css";

export function SocialSearchForm({ query = "" }: SocialSearchFormProps) {
  const [search, setSearch] = useState(query);
  const router = useSmartRouter();
  const { t } = useI18n();
  return (
    <form
      className={s.search}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        router.push("/social", { view: "people", query: search.trim() || undefined });
      }}
    >
      <Search aria-hidden="true" />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label={t("social.searchPeople")}
        placeholder={t("social.searchPeople")}
      />
      <button type="submit" className={s.textButton}>
        {t("social.search")}
      </button>
    </form>
  );
}
