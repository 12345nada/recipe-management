import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../styles/SearchableProductSelect.css";

export default function SearchableProductSelect({ name, value, options, placeholder, label, disabled, onChange }) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const input = useRef(null);
  const matches = options.filter((option) => `${option.label} ${option.value} ${option.search || ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const choose = (option) => {
    if (option.disabled) return;
    onChange({ target: { name, value: option.value } });
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!open) return;
    const rect = trigger.current.getBoundingClientRect();
    const height = Math.min(280, Math.max(96, window.innerHeight - rect.bottom - 12));
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), width: rect.width,
      top: rect.bottom + 4, height,
      direction: getComputedStyle(trigger.current).direction });
  }, [open]);
  useEffect(() => { if (open && position) input.current?.focus({ preventScroll: true }); }, [open, position]);
  useEffect(() => {
    const option = menu.current?.querySelector('[aria-selected="true"]');
    const list = option?.parentElement;
    if (!list) return;
    const top = option.getBoundingClientRect().top - list.getBoundingClientRect().top;
    if (top < 0) list.scrollTop += top;
    else if (top + option.offsetHeight > list.clientHeight) list.scrollTop += top + option.offsetHeight - list.clientHeight;
  }, [active, open, search]);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false); };
    const move = (event) => { if (!menu.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", move);
    document.addEventListener("scroll", move, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", move); document.removeEventListener("scroll", move, true); };
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className="product-searchable-select">
    <select className="product-select-validation" name={name} value={value} required disabled={disabled} tabIndex={-1} aria-hidden="true" onChange={onChange}
      onInvalid={(event) => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }}>
      <option value="" />{options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
    <button ref={trigger} type="button" className="product-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
      onClick={() => { setSearch(""); setActive(0); setOpen(!open); }} onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setSearch(""); setActive(0); setOpen(true); }
      }}><span>{options.find((option) => option.value === value)?.label || placeholder}</span><ChevronDown size={16} /></button>
    {open && createPortal(<div ref={menu} className="product-select-menu" style={position || { visibility: "hidden" }}
      onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus({ preventScroll: true }); }
        if (event.key === "Tab") setOpen(false);
      }}>
      <input ref={input} role="combobox" aria-label={`${t("common.search")} ${label}`} placeholder={t("common.search")} aria-expanded="true" aria-controls={id}
        aria-activedescendant={matches[active] ? `${id}-${active}` : undefined}
        value={search} onChange={(event) => { setSearch(event.target.value); setActive(0); }} onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(0, Math.min(matches.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))); }
          if (event.key === "Enter") { event.preventDefault(); if (matches[active]) choose(matches[active]); }
        }} />
      <div id={id} role="listbox" aria-label={label}>{matches.map((option, index) => <button key={option.value} id={`${id}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={index === active} disabled={option.disabled}
        onClick={() => choose(option)}>{option.label}</button>)}{!matches.length && <p role="status">{t("common.noResultsFound")}</p>}</div>
    </div>, document.body)}
  </div>;
}
