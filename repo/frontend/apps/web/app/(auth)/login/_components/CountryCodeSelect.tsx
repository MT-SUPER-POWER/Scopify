"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { COUNTRY_CODES, getCountryByCode } from "@/constants/countryCodes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CountryCodeItem, CountryCodeSelectProps } from "@/types/auth/login";

export function CountryCodeSelect({ value, onChange, disabled = false }: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  const currentCountry = useMemo(() => getCountryByCode(value), [value]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.code.includes(query) ||
        c.nameZh.toLowerCase().includes(query) ||
        c.nameEn.toLowerCase().includes(query),
    );
  }, [search]);

  const popularList = useMemo(
    () => filteredCountries.filter((c) => c.popular),
    [filteredCountries],
  );

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setSearch("");
  };

  const getCountryName = (country: CountryCodeItem) => (isEn ? country.nameEn : country.nameZh);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 shrink-0 items-center justify-between gap-1.5 rounded-md border border-content/10 bg-content/5 px-2.5 text-xs font-medium text-content transition-colors outline-none hover:bg-content/10 focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50",
          )}
          title={getCountryName(currentCountry)}
          aria-label={getCountryName(currentCountry)}
        >
          <span className="text-base leading-none">{currentCountry.flag}</span>
          <span className="font-mono text-xs text-content">+{currentCountry.code}</span>
          <ChevronDown className="size-3 text-content-subtle opacity-70" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 border-content/10 bg-surface-elevated p-2 shadow-floating backdrop-blur-xl"
      >
        <div className="relative mb-2">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-content-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("login.countryCode.searchPlaceholder")}
            className="h-8 w-full rounded-md border border-content/10 bg-content/5 pr-2.5 pl-8 text-xs text-content outline-none placeholder:text-content-subtle focus:border-brand/40 focus:ring-1 focus:ring-brand"
            autoFocus
          />
        </div>

        <ScrollArea className="h-56 pr-1">
          {filteredCountries.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">
              {t("login.countryCode.noResults")}
            </div>
          ) : (
            <div className="space-y-2">
              {!search.trim() && popularList.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-content-subtle uppercase">
                    {t("login.countryCode.popular")}
                  </div>
                  <div className="space-y-0.5">
                    {popularList.map((country) => (
                      <CountryRow
                        key={`pop-${country.code}-${country.nameEn}`}
                        country={country}
                        selected={value === country.code}
                        displayName={getCountryName(country)}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                  <div className="my-1.5 border-t border-content/5" />
                </div>
              )}

              <div>
                {!search.trim() && (
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-content-subtle uppercase">
                    {t("login.countryCode.all")}
                  </div>
                )}
                <div className="space-y-0.5">
                  {filteredCountries.map((country) => (
                    <CountryRow
                      key={`all-${country.code}-${country.nameEn}`}
                      country={country}
                      selected={value === country.code}
                      displayName={getCountryName(country)}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function CountryRow({
  country,
  selected,
  displayName,
  onSelect,
}: {
  country: CountryCodeItem;
  selected: boolean;
  displayName: string;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country.code)}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        selected ? "bg-brand/10 font-semibold text-brand" : "text-content hover:bg-content/5",
      )}
    >
      <div className="flex items-center gap-2 truncate">
        <span className="text-sm leading-none">{country.flag}</span>
        <span className="truncate">{displayName}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-2">
        <span className="font-mono text-[11px] text-content-subtle">+{country.code}</span>
        {selected && <Check className="size-3 text-brand" />}
      </div>
    </button>
  );
}
