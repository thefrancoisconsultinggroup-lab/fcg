"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Menu, X } from "lucide-react";
import { mainNavigation, type NavigationItem } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", menuOpen);

    return () => document.body.classList.remove("mobile-nav-open");
  }, [menuOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setOpenDesktopMenu(null);
      }
    };

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        navRef.current &&
        event.target instanceof Node &&
        !navRef.current.contains(event.target)
      ) {
        setOpenDesktopMenu(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.24 };

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 bg-transparent">
      <Container className="site-header__container">
        <div
          className={cn(
            "site-header__inner flex min-h-20 items-center justify-between gap-5 px-0 text-foreground transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled && "py-3",
          )}
        >
          <Link
            href="/"
            className={cn(
              "site-header__brand inline-flex min-h-[5.25rem] items-center gap-3 rounded-[1.7rem] px-4 py-3 text-current transition hover:text-accent-yellow focus-visible:outline-accent-yellow sm:gap-4 sm:px-5",
              scrolled &&
                "site-header__brand-shell bg-[#0a2740]/92 shadow-[0_18px_40px_rgba(2,12,24,0.22)]",
            )}
            onClick={() => {
              setMenuOpen(false);
              setOpenDesktopMenu(null);
            }}
          >
            <Image
              src="/assets/migrated/shared/brand-cropped-francois-logo.png"
              alt=""
              width={220}
              height={103}
              className="site-header__brand-mark h-14 w-auto transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              priority
            />
            <span className="site-header__brand-name font-display text-current">
              <span>François</span>
              <span>Consulting</span>
              <span>Group</span>
            </span>
          </Link>

          <nav
            ref={navRef}
            aria-label="Main navigation"
            className={cn(
              "site-header__desktop-nav hidden items-center gap-2 rounded-full px-3 py-2 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] xl:flex",
              scrolled && "bg-[#0a2740]/92 shadow-[0_18px_40px_rgba(2,12,24,0.22)]",
            )}
          >
            {mainNavigation.map((item) => (
              <DesktopNavItem
                key={item.href}
                item={item}
                openDesktopMenu={openDesktopMenu}
                setOpenDesktopMenu={setOpenDesktopMenu}
              />
            ))}
          </nav>

          <div className="ml-auto flex items-center justify-end gap-2 xl:ml-0">
            <Link
              href="/contact"
              className={cn(
                "site-header__contact hidden min-h-11 items-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.18em] transition focus-visible:outline-accent-yellow xl:inline-flex",
                "duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                scrolled
                  ? "bg-accent-yellow text-ink shadow-[0_18px_40px_rgba(2,12,24,0.2)] hover:bg-[#ffe080]"
                  : "border border-accent-yellow/70 text-current hover:bg-accent-yellow hover:text-ink",
              )}
              onClick={() => setOpenDesktopMenu(null)}
            >
              Contact
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="site-header__menu-button inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/24 text-current transition hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-accent-yellow xl:hidden"
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
            >
              {menuOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="site-header__mobile-overlay fixed inset-0 -z-10 overflow-y-auto overscroll-contain bg-background/96 px-5 pt-32 text-foreground backdrop-blur-xl xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <motion.nav
              aria-label="Mobile main navigation"
              className="site-header__mobile-nav mx-auto flex min-h-[calc(100svh-8rem)] max-w-[1440px] flex-col gap-8 border-t border-foreground/16 pb-16 pt-8"
              initial={reduceMotion ? false : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: 16, opacity: 0 }}
              transition={transition}
            >
              {mainNavigation.map((item) => (
                <MobileNavGroup
                  key={item.href}
                  item={item}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
              <Link
                href="/contact"
                className="inline-flex min-h-12 w-fit items-center rounded-full bg-accent-yellow px-6 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-[#ffe080] focus-visible:outline-accent-yellow"
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </Link>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

type DesktopNavItemProps = {
  item: NavigationItem;
  openDesktopMenu: string | null;
  setOpenDesktopMenu: (href: string | null) => void;
};

function DesktopNavItem({
  item,
  openDesktopMenu,
  setOpenDesktopMenu,
}: DesktopNavItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const isOpen = openDesktopMenu === item.href;
  const menuId = `desktop-menu-${item.href.replaceAll("/", "-") || "home"}`;

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className="site-header__desktop-link rounded-full px-3 py-2 text-sm font-medium text-current transition hover:text-accent-yellow focus-visible:outline-accent-yellow"
        onClick={() => setOpenDesktopMenu(null)}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="site-header__desktop-link inline-flex min-h-10 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-current transition hover:text-accent-yellow focus-visible:outline-accent-yellow"
        onClick={() => setOpenDesktopMenu(isOpen ? null : item.href)}
      >
        {item.label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={menuId}
            className="site-header__desktop-menu absolute left-0 top-full mt-3 w-80 rounded-lg border border-foreground/18 bg-surface-dark/96 p-2 shadow-[var(--shadow-soft)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
          >
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="site-header__desktop-submenu-link block rounded-md px-4 py-3 text-sm leading-6 text-muted-light transition hover:bg-surface-ocean/35 hover:text-foreground focus-visible:outline-accent-yellow"
                onClick={() => setOpenDesktopMenu(null)}
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type MobileNavGroupProps = {
  item: NavigationItem;
  onNavigate: () => void;
};

function MobileNavGroup({ item, onNavigate }: MobileNavGroupProps) {
  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        className="site-header__mobile-link font-display rounded-sm text-4xl font-normal leading-tight text-foreground transition hover:text-accent-yellow focus-visible:outline-accent-yellow"
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <p className="site-header__mobile-label mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-accent-yellow">
        {item.label}
      </p>
      <div className="site-header__mobile-children flex flex-col gap-3 border-l border-foreground/18 pl-4">
        {item.children.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            className="site-header__mobile-link font-display rounded-sm text-3xl font-normal leading-tight text-foreground transition hover:text-accent-yellow focus-visible:outline-accent-yellow"
            onClick={onNavigate}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
