"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useTranslation } from "react-i18next";

import type { SocialSearchFormProps } from "@/types/social/components";
import {
  socialSearchClass,
  socialSearchInputClass,
  socialTextButtonClass,
} from "@/components/social/socialClasses";

export function SocialSearchForm({ query = "" }: SocialSearchFormProps) {
  const [search, setSearch] = useState(query);
  const router = useSmartRouter();
  const { t } = useTranslation();
  return (
    <form
      className={socialSearchClass}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        router.push("/social", { view: "people", query: search.trim() || undefined });
      }}
    >
      <Search aria-hidden="true" />
      <input
        className={socialSearchInputClass}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label={t("social.searchPeople")}
        placeholder={t("social.searchPeople")}
      />
      <button type="submit" className={socialTextButtonClass}>
        {t("social.search")}
      </button>
    </form>
  );
}
