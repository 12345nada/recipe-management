import { useLayoutEffect, useRef } from "react";

export default function AnchoredActionMenu({
  anchor,
  style,
  children,
  ...props
}) {
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu || !anchor) return;

    const positionMenu = () => {
      if (!anchor.isConnected) return;

      const buttonRect = anchor.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const gap = 10;
      const edge = 12;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const openBelow =
        spaceBelow >= menuRect.height + gap ||
        spaceBelow >= spaceAbove;
      const preferredTop = openBelow
        ? buttonRect.bottom + gap
        : buttonRect.top - menuRect.height - gap;
      const rtl = getComputedStyle(anchor).direction === "rtl";
      const preferredLeft = rtl
        ? buttonRect.left
        : buttonRect.right - menuRect.width;

      menu.style.top = `${Math.max(
        edge,
        Math.min(preferredTop, window.innerHeight - menuRect.height - edge)
      )}px`;
      menu.style.left = `${Math.max(
        edge,
        Math.min(preferredLeft, window.innerWidth - menuRect.width - edge)
      )}px`;
    };

    const handleScroll = (event) => {
      const target = event.target;
      if (
        target === document ||
        target === window ||
        (target instanceof Element && target.contains(anchor))
      ) {
        positionMenu();
      }
    };

    const handleMotionEnd = (event) => {
      if (
        event.target instanceof Element &&
        event.target.contains(anchor)
      ) {
        positionMenu();
      }
    };

    menu.showPopover();
    positionMenu();

    const observer = new ResizeObserver(positionMenu);
    observer.observe(menu);
    observer.observe(anchor);
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("animationend", handleMotionEnd, true);
    document.addEventListener("animationcancel", handleMotionEnd, true);
    document.addEventListener("transitionend", handleMotionEnd, true);
    document.addEventListener("transitioncancel", handleMotionEnd, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("animationend", handleMotionEnd, true);
      document.removeEventListener("animationcancel", handleMotionEnd, true);
      document.removeEventListener("transitionend", handleMotionEnd, true);
      document.removeEventListener("transitioncancel", handleMotionEnd, true);
      if (menu.matches(":popover-open")) menu.hidePopover();
    };
  }, [anchor]);

  return (
    <div
      {...props}
      ref={menuRef}
      popover="manual"
      style={{
        ...style,
        position: "fixed",
        inset: "auto",
        margin: 0,
        color: "inherit",
      }}
    >
      {children}
    </div>
  );
}
