"use client";
import React from "react";

export type IconName =
  | "home" | "pray" | "gospel" | "petition" | "bell"
  | "articles" | "prayers" | "user" | "users" | "settings" | "logout" | "shield"
  | "search" | "arrow-left" | "chevron-right" | "chevron-left" | "chevron-up" | "chevron-down"
  | "external" | "share" | "refresh" | "wifi-off" | "loader"
  | "heart" | "calendar" | "check-circle" | "check" | "close" | "play"
  | "lock" | "eye" | "eye-off" | "phone" | "mail" | "map-pin"
  | "palette" | "type" | "pen" | "trash" | "book-open"
  | "plus" | "minus" | "info" | "star" | "cross" | "jerusalem-cross"
  | "catechism" | "donate" | "announcements" | "chat" | "etiquette"
  | "about" | "video-play" | "quote";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.5 }: IconProps) {
  const sw = strokeWidth;
  const s = { stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const sf = (op?: number) => ({ ...s, opacity: op ?? 1 });

  const renderIcon = (): React.ReactNode => {
    switch (name) {

      /* ── NAWIGACJA ────────────────────────────────────────────── */

      case "home":
        // Dom z krzyżykiem na szczycie
        return (
          <>
            <polyline {...sf()} points="2.5,12 12,3.5 21.5,12" />
            <path {...sf()} d="M5,10.8 L5,20 Q5,21 6,21 L9.5,21 L9.5,15 L14.5,15 L14.5,21 L18,21 Q19,21 19,20 L19,10.8" />
            <line {...sf(0.8)} x1="12" y1="3.5" x2="12" y2="1.5" strokeWidth={sw * 0.75} />
            <line {...sf(0.8)} x1="10.8" y1="2.3" x2="13.2" y2="2.3" strokeWidth={sw * 0.75} />
          </>
        );

      case "articles":
        // Zwój / strona z ozdobnymi liniami
        return (
          <>
            <path {...sf()} d="M6,3 Q4,3 4,5 L4,19 Q4,21 6,21 L18,21 Q20,21 20,19 L20,5 Q20,3 18,3 Z" />
            <line {...sf()} x1="8" y1="8" x2="16" y2="8" />
            <line {...sf()} x1="8" y1="12" x2="16" y2="12" />
            <line {...sf()} x1="8" y1="16" x2="13" y2="16" />
            {/* Ozdobny zawinięty róg */}
            <path {...sf(0.6)} d="M16,3 L16,6 Q16,7 17,7 L20,7" strokeWidth={sw * 0.8} />
          </>
        );

      case "gospel":
        // Otwarta księga z krzyżem
        return (
          <>
            <path {...sf()} d="M4,5 Q4,3 6,3 L11.5,3 L11.5,21 L5,21 Q4,21 4,20 Z" />
            <path {...sf()} d="M12.5,3 L18,3 Q20,3 20,5 L20,20 Q20,21 19,21 L12.5,21 Z" />
            <line {...sf()} x1="12" y1="3" x2="12" y2="21" strokeWidth={sw * 0.55} />
            {/* Krzyż na prawej stronie */}
            <line {...sf()} x1="16" y1="8" x2="16" y2="15" strokeWidth={sw * 0.9} />
            <line {...sf()} x1="13.8" y1="10.5" x2="18.2" y2="10.5" strokeWidth={sw * 0.9} />
            {/* Linie tekstu na lewej */}
            <line {...sf(0.45)} x1="6.5" y1="9" x2="10" y2="9" strokeWidth={sw * 0.7} />
            <line {...sf(0.45)} x1="6.5" y1="12" x2="10" y2="12" strokeWidth={sw * 0.7} />
            <line {...sf(0.45)} x1="6.5" y1="15" x2="10" y2="15" strokeWidth={sw * 0.7} />
          </>
        );

      case "petition":
        // Pióro / gęsie pióro
        return (
          <>
            <path {...sf()} d="M20.5,3.5 C18,1.5 13,4 11,8 L9,15 L15,13 C19,11 22,6.5 20.5,3.5 Z" />
            <path {...sf()} d="M11,8 C10,9 9,11 9,15" strokeWidth={sw * 0.6} />
            <path {...sf()} d="M9,15 C8,16.5 7,18.5 6.5,20.5 C8,19.5 10,18.5 11.5,17.5 L9,15" />
            <path {...sf(0.55)} d="M9,15 L7.5,20" strokeWidth={sw * 0.7} />
          </>
        );

      case "prayers":
        // Złożone dłonie do modlitwy
        return (
          <>
            {/* Zewnętrzny zarys dłoni */}
            <path {...sf()} d="M12,21 C9,21 7,18.5 7,16 L7,12.5 C7,11.5 7.8,11 8.5,11.5 L8.5,14" />
            <path {...sf()} d="M8.5,14 L7.5,9 C7.3,8 8,7.5 8.8,8 L9.5,11" />
            <path {...sf()} d="M9.5,11 L9,6.5 C8.8,5.5 9.8,5 10.3,5.8 L11,9.5" />
            <path {...sf()} d="M11,9.5 L10.8,6 C10.8,5 12,5 12,6 L12,9.5" />
            {/* Prawa ręka (lustro) */}
            <path {...sf()} d="M12,21 C15,21 17,18.5 17,16 L17,12.5 C17,11.5 16.2,11 15.5,11.5 L15.5,14" />
            <path {...sf()} d="M15.5,14 L16.5,9 C16.7,8 16,7.5 15.2,8 L14.5,11" />
            <path {...sf()} d="M14.5,11 L15,6.5 C15.2,5.5 14.2,5 13.7,5.8 L13,9.5" />
            <path {...sf()} d="M13,9.5 L13.2,6 C13.2,5 12,5 12,6 L12,9.5" />
            {/* Kciuki */}
            <path {...sf(0.6)} d="M7,12.5 C6,12.5 5.5,14 6.5,15" strokeWidth={sw * 0.75} />
            <path {...sf(0.6)} d="M17,12.5 C18,12.5 18.5,14 17.5,15" strokeWidth={sw * 0.75} />
          </>
        );

      case "bell":
        // Klasyczny dzwon z ozdobą
        return (
          <>
            <path {...sf()} d="M6,17 L6,13.5 C6,9.5 8.5,6.5 12,6.5 C15.5,6.5 18,9.5 18,13.5 L18,17 Z" />
            <path {...sf()} d="M10.5,6.5 C10.5,5.5 11,4.5 12,4.5 C13,4.5 13.5,5.5 13.5,6.5" />
            <line {...sf()} x1="12" y1="4.5" x2="12" y2="2.5" />
            <line {...sf(0.7)} x1="10.8" y1="2.5" x2="13.2" y2="2.5" strokeWidth={sw * 0.7} />
            <path {...sf()} d="M4.5,17 Q4,17.5 5,18 L19,18 Q20,17.5 19.5,17" />
            <path {...sf()} d="M10.3,18 Q10,19.5 12,20.5 Q14,19.5 13.7,18" />
          </>
        );

      /* ── TOPBAR ────────────────────────────────────────────────── */

      case "user":
        // Klasyczna sylwetka z kołnierzykiem
        return (
          <>
            <circle {...sf()} cx="12" cy="8" r="4" />
            <path {...sf()} d="M4,21 C4,17 7.5,14.5 12,14.5 C16.5,14.5 20,17 20,21" />
            <path {...sf(0.5)} d="M9.5,14.5 C10,16.5 14,16.5 14.5,14.5" strokeWidth={sw * 0.65} />
          </>
        );

      case "users":
        return (
          <>
            <circle {...sf()} cx="16" cy="8.5" r="3" strokeWidth={sw * 0.8} />
            <path {...sf()} d="M19.5,21 C19.5,17.8 17.5,16 15,15.3" strokeWidth={sw * 0.8} />
            <circle {...sf()} cx="9.5" cy="8.5" r="3.5" />
            <path {...sf()} d="M3,21 C3,17.5 5.5,15 9.5,15 C13.5,15 16,17.5 16,21" />
          </>
        );

      case "settings":
        // Przekładnia z ozdobnym wewnętrznym kołem
        return (
          <>
            <circle {...sf()} cx="12" cy="12" r="3" />
            <path {...sf()} d="M12,2.5 L12,4.5 M12,19.5 L12,21.5 M2.5,12 L4.5,12 M19.5,12 L21.5,12 M5.6,5.6 L7,7 M17,17 L18.4,18.4 M5.6,18.4 L7,17 M17,7 L18.4,5.6" strokeWidth={sw * 0.8} />
            <circle {...sf(0.35)} cx="12" cy="12" r="6.5" strokeWidth={sw * 0.6} />
          </>
        );

      case "logout":
        return (
          <>
            <path {...sf()} d="M9.5,21 L5,21 Q4,21 4,20 L4,4 Q4,3 5,3 L9.5,3" />
            <polyline {...sf()} points="16,17 21,12 16,7" />
            <line {...sf()} x1="21" y1="12" x2="9" y2="12" />
          </>
        );

      case "shield":
        return (
          <>
            <path {...sf()} d="M12,2 L4,6 L4,12 C4,16.8 7.5,21 12,22.5 C16.5,21 20,16.8 20,12 L20,6 Z" />
            <polyline {...sf()} points="9,12 11,14 15,10" />
          </>
        );

      /* ── AKCJE / UI ────────────────────────────────────────────── */

      case "search":
        return (
          <>
            <circle {...sf()} cx="10.5" cy="10.5" r="6.5" />
            <line {...sf()} x1="15.5" y1="15.5" x2="21" y2="21" />
            <circle {...sf(0.3)} cx="10.5" cy="10.5" r="3.5" strokeWidth={sw * 0.5} />
          </>
        );

      case "arrow-left":
        return (
          <>
            <polyline {...sf()} points="14.5,18 8.5,12 14.5,6" />
            <line {...sf(0.5)} x1="8.5" y1="12" x2="21" y2="12" strokeWidth={sw * 0.7} />
          </>
        );

      case "chevron-right": return <polyline {...sf()} points="9,6 15,12 9,18" />;
      case "chevron-left":  return <polyline {...sf()} points="15,6 9,12 15,18" />;
      case "chevron-up":    return <polyline {...sf()} points="6,15 12,9 18,15" />;
      case "chevron-down":  return <polyline {...sf()} points="6,9 12,15 18,9" />;

      case "external":
        return (
          <>
            <path {...sf()} d="M18,13.5 L18,19 Q18,20 17,20 L5,20 Q4,20 4,19 L4,7 Q4,6 5,6 L10.5,6" />
            <polyline {...sf()} points="15,3 21,3 21,9" />
            <line {...sf()} x1="10.5" y1="13.5" x2="21" y2="3" />
          </>
        );

      case "share":
        return (
          <>
            <circle {...sf()} cx="18" cy="5" r="2.5" />
            <circle {...sf()} cx="6" cy="12" r="2.5" />
            <circle {...sf()} cx="18" cy="19" r="2.5" />
            <line {...sf()} x1="8.4" y1="10.7" x2="15.6" y2="6.3" />
            <line {...sf()} x1="8.4" y1="13.3" x2="15.6" y2="17.7" />
          </>
        );

      case "refresh":
        return (
          <>
            <path {...sf()} d="M21,12 C21,7.5 17.5,4 13,3.5 L10,3.5" />
            <path {...sf()} d="M3,12 C3,16.5 6.5,20 11,20.5 L14,20.5" />
            <polyline {...sf()} points="7,1.5 10,3.5 7,5.5" />
            <polyline {...sf()} points="17,18.5 14,20.5 17,22.5" />
          </>
        );

      case "wifi-off":
        return (
          <>
            <line {...sf()} x1="2" y1="2" x2="22" y2="22" />
            <path {...sf()} d="M8.5,8.5 C5.5,10 3,13 3,13" />
            <path {...sf()} d="M15.5,8.5 C18,10 21,13 21,13" />
            <path {...sf()} d="M5,16 C7,14 9.5,13 12,13 C14.5,13 17,14 19,16" />
            <circle cx="12" cy="20" r="1.2" fill="currentColor" strokeWidth={0} />
          </>
        );

      case "loader":
        return (
          <>
            <circle {...sf(0.2)} cx="12" cy="12" r="9" strokeWidth={sw * 0.7} />
            <path {...sf()} d="M12,3 a9,9 0 0 1,9,9" />
          </>
        );

      case "heart":
        return (
          <path
            d="M20.84,4.61a5.5,5.5,0,0,0-7.78,0L12,5.67l-1.06-1.06a5.5,5.5,0,0,0-7.78,7.78l1.06,1.06L12,21.23l7.78-7.78,1.06-1.06A5.5,5.5,0,0,0,20.84,4.61Z"
            fill="currentColor"
            stroke="none"
          />
        );

      case "calendar":
        return (
          <>
            <rect {...sf()} x="3" y="4" width="18" height="18" rx="2" />
            <line {...sf()} x1="3" y1="9.5" x2="21" y2="9.5" />
            <line {...sf()} x1="8" y1="2" x2="8" y2="6" />
            <line {...sf()} x1="16" y1="2" x2="16" y2="6" />
            <circle cx="8" cy="14" r="1.1" fill="currentColor" strokeWidth={0} />
            <circle cx="12" cy="14" r="1.1" fill="currentColor" strokeWidth={0} />
            <circle cx="16" cy="14" r="1.1" fill="currentColor" strokeWidth={0} />
            <circle cx="8" cy="18" r="1.1" fill="currentColor" strokeWidth={0} />
            <circle cx="12" cy="18" r="1.1" fill="currentColor" strokeWidth={0} />
          </>
        );

      case "check-circle":
        return (
          <>
            <circle {...sf()} cx="12" cy="12" r="9.5" />
            <polyline {...sf()} points="7.5,12 10.5,15.5 16.5,8.5" />
          </>
        );

      case "check":
        return <polyline {...sf()} points="4,13 9,18 20,7" />;

      case "close":
        return (
          <>
            <line {...sf()} x1="18" y1="6" x2="6" y2="18" />
            <line {...sf()} x1="6" y1="6" x2="18" y2="18" />
          </>
        );

      case "play":
        return <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />;

      case "lock":
        return (
          <>
            <rect {...sf()} x="5" y="11" width="14" height="11" rx="2" />
            <path {...sf()} d="M8,11 L8,7 a4,4 0 0 1,8,0 L16,11" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" strokeWidth={0} />
            <line {...sf()} x1="12" y1="17.5" x2="12" y2="20" strokeWidth={sw * 0.8} />
          </>
        );

      case "eye":
        return (
          <>
            <path {...sf()} d="M1.5,12 C4,7 7.5,4.5 12,4.5 C16.5,4.5 20,7 22.5,12 C20,17 16.5,19.5 12,19.5 C7.5,19.5 4,17 1.5,12 Z" />
            <circle {...sf()} cx="12" cy="12" r="3.5" />
            <circle cx="13.2" cy="10.8" r="1" fill="currentColor" strokeWidth={0} />
          </>
        );

      case "eye-off":
        return (
          <>
            <line {...sf()} x1="2" y1="2" x2="22" y2="22" />
            <path {...sf()} d="M6.7,6.7 C4,8.5 2,11.5 1.5,12 C4,17 7.5,19.5 12,19.5 C14,19.5 15.8,18.9 17.4,18" />
            <path {...sf()} d="M10,4.5 C10.6,4.5 11.3,4.5 12,4.5 C16.5,4.5 20,7 22.5,12 C22,13 21,15 19.5,16.5" />
            <path {...sf()} d="M9.5,9.5 a3.5,3.5 0 0 0,5,5" />
          </>
        );

      case "phone":
        return (
          <path {...sf()} d="M22,16.9v3a2,2,0,0,1-2.18,2,19.79,19.79,0,0,1-8.63-3.07A19.5,19.5,0,0,1,4.14,11.94,19.79,19.79,0,0,1,1.1,3.37,2,2,0,0,1,3.05,1.12h3a2,2,0,0,1,2,1.72A12.84,12.84,0,0,0,8.76,6.6a2,2,0,0,1-.45,2.1L7.09,9.91A16,16,0,0,0,13,15.91l1.21-1.21a2,2,0,0,1,2.11-.45,12.84,12.84,0,0,0,3.76.7A2,2,0,0,1,22,16.9Z" />
        );

      case "mail":
        return (
          <>
            <rect {...sf()} x="2" y="4.5" width="20" height="15" rx="2" />
            <polyline {...sf()} points="2,4.5 12,14 22,4.5" />
          </>
        );

      case "map-pin":
        return (
          <>
            <path {...sf()} d="M12,2.5 C8.7,2.5 6,5.2 6,8.5 C6,13.5 12,21.5 12,21.5 C12,21.5 18,13.5 18,8.5 C18,5.2 15.3,2.5 12,2.5 Z" />
            <circle {...sf()} cx="12" cy="8.5" r="2.5" />
          </>
        );

      case "palette":
        return (
          <>
            <path {...sf()} d="M12,2 C6.5,2 2,6.5 2,12 C2,17.5 6.5,22 12,22 C12.8,22 13.5,21.3 13.5,20.5 C13.5,20.1 13.35,19.75 13.1,19.5 C12.85,19.25 12.7,18.9 12.7,18.5 C12.7,17.7 13.4,17 14.2,17 L16,17 C19.3,17 22,14.3 22,11 C22,6 17.5,2 12,2 Z" />
            <circle cx="6.5" cy="11.5" r="1.4" fill="currentColor" strokeWidth={0} />
            <circle cx="9" cy="7" r="1.4" fill="currentColor" strokeWidth={0} />
            <circle cx="14" cy="6.5" r="1.4" fill="currentColor" strokeWidth={0} />
            <circle cx="18" cy="9.5" r="1.4" fill="currentColor" strokeWidth={0} />
          </>
        );

      case "type":
        return (
          <>
            <polyline {...sf()} points="4,7 4,4 20,4 20,7" />
            <line {...sf()} x1="9" y1="20" x2="15" y2="20" />
            <line {...sf()} x1="12" y1="4" x2="12" y2="20" />
          </>
        );

      case "pen":
        return (
          <>
            <path {...sf()} d="M12,20 h9" />
            <path {...sf()} d="M16.5,3.5 a2.12,2.12,0,0,1,3,3 L7,19 l-4,1 1,-4 z" />
          </>
        );

      case "trash":
        return (
          <>
            <polyline {...sf()} points="3,6 5,6 21,6" />
            <path {...sf()} d="M19,6 L18,20 a1,1,0,0,1-1,1 H7 a1,1,0,0,1-1-1 L5,6" />
            <path {...sf()} d="M9,6 V4 a1,1,0,0,1,1-1 h4 a1,1,0,0,1,1,1 V6" />
            <line {...sf(0.6)} x1="10" y1="11" x2="10" y2="17" strokeWidth={sw * 0.75} />
            <line {...sf(0.6)} x1="14" y1="11" x2="14" y2="17" strokeWidth={sw * 0.75} />
          </>
        );

      case "book-open":
        return (
          <>
            <path {...sf()} d="M2,4.5 L2,19.5 C2,19.5 7,18 12,19.5 C17,18 22,19.5 22,19.5 L22,4.5 C22,4.5 17,3 12,4.5 C7,3 2,4.5 2,4.5 Z" />
            <line {...sf()} x1="12" y1="4.5" x2="12" y2="19.5" strokeWidth={sw * 0.6} />
          </>
        );

      case "plus":
        return (
          <>
            <line {...sf()} x1="12" y1="5" x2="12" y2="19" />
            <line {...sf()} x1="5" y1="12" x2="19" y2="12" />
          </>
        );

      case "minus":
        return <line {...sf()} x1="5" y1="12" x2="19" y2="12" />;

      case "info":
        return (
          <>
            <circle {...sf()} cx="12" cy="12" r="9.5" />
            <line {...sf()} x1="12" y1="11" x2="12" y2="17" />
            <circle cx="12" cy="7.5" r="1" fill="currentColor" strokeWidth={0} />
          </>
        );

      case "star":
        return (
          <path
            d="M12,2l3.09,6.26L22,9.27l-5,4.87,1.18,6.88L12,17.77l-6.18,3.25L7,14.14,2,9.27l6.91-1.01Z"
            fill="currentColor"
            stroke="none"
          />
        );

      case "cross":
        return (
          <>
            <line {...sf()} x1="12" y1="3" x2="12" y2="21" strokeWidth={sw * 1.2} />
            <line {...sf()} x1="5" y1="9" x2="19" y2="9" strokeWidth={sw * 1.2} />
          </>
        );

      case "jerusalem-cross":
        // Krzyż Jerozolimski z koronkowym ornamentem
        return (
          <>
            {/* Ozdobny zewnętrzny okrąg — koronkowa ramka */}
            <circle {...sf(0.22)} cx="12" cy="12" r="10.2" strokeWidth={sw * 0.5} strokeDasharray="1.2 1.8" />
            {/* Duży krzyż centralny — smukły */}
            <line {...sf()} x1="12" y1="3.5" x2="12" y2="20.5" strokeWidth={sw * 0.75} />
            <line {...sf()} x1="3.5" y1="12" x2="20.5" y2="12" strokeWidth={sw * 0.75} />
            {/* Ozdobne rombiki na końcach ramion głównego krzyża */}
            <path {...sf(0.55)} d="M12,2.2 L12.7,3.5 L12,4.8 L11.3,3.5 Z" strokeWidth={sw * 0.4} fill="currentColor" />
            <path {...sf(0.55)} d="M12,21.8 L12.7,20.5 L12,19.2 L11.3,20.5 Z" strokeWidth={sw * 0.4} fill="currentColor" />
            <path {...sf(0.55)} d="M2.2,12 L3.5,12.7 L4.8,12 L3.5,11.3 Z" strokeWidth={sw * 0.4} fill="currentColor" />
            <path {...sf(0.55)} d="M21.8,12 L20.5,12.7 L19.2,12 L20.5,11.3 Z" strokeWidth={sw * 0.4} fill="currentColor" />
            {/* Mały krzyż — lewy górny */}
            <line {...sf()} x1="6.5" y1="4.2" x2="6.5" y2="8.8" strokeWidth={sw * 0.58} />
            <line {...sf()} x1="4.2" y1="6.5" x2="8.8" y2="6.5" strokeWidth={sw * 0.58} />
            {/* Mały krzyż — prawy górny */}
            <line {...sf()} x1="17.5" y1="4.2" x2="17.5" y2="8.8" strokeWidth={sw * 0.58} />
            <line {...sf()} x1="15.2" y1="6.5" x2="19.8" y2="6.5" strokeWidth={sw * 0.58} />
            {/* Mały krzyż — lewy dolny */}
            <line {...sf()} x1="6.5" y1="15.2" x2="6.5" y2="19.8" strokeWidth={sw * 0.58} />
            <line {...sf()} x1="4.2" y1="17.5" x2="8.8" y2="17.5" strokeWidth={sw * 0.58} />
            {/* Mały krzyż — prawy dolny */}
            <line {...sf()} x1="17.5" y1="15.2" x2="17.5" y2="19.8" strokeWidth={sw * 0.58} />
            <line {...sf()} x1="15.2" y1="17.5" x2="19.8" y2="17.5" strokeWidth={sw * 0.58} />
            {/* Ozdobne kropki między krzyżami — koronkowy akcent */}
            <circle cx="12" cy="6.5" r="0.55" fill="currentColor" strokeWidth={0} opacity={0.45} />
            <circle cx="12" cy="17.5" r="0.55" fill="currentColor" strokeWidth={0} opacity={0.45} />
            <circle cx="6.5" cy="12" r="0.55" fill="currentColor" strokeWidth={0} opacity={0.45} />
            <circle cx="17.5" cy="12" r="0.55" fill="currentColor" strokeWidth={0} opacity={0.45} />
          </>
        );

      case "catechism":
        // Otwarta księga z pytajnikiem — katechizm
        return (
          <>
            <path {...sf()} d="M4,4.5 Q4,3 5.5,3 L11,3 L11,20 L5.5,20 Q4,20 4,18.5 Z" />
            <path {...sf()} d="M20,4.5 Q20,3 18.5,3 L13,3 L13,20 L18.5,20 Q20,20 20,18.5 Z" />
            <line {...sf(0.5)} x1="11" y1="3" x2="11" y2="20" strokeWidth={sw * 0.4} />
            <line {...sf(0.5)} x1="13" y1="3" x2="13" y2="20" strokeWidth={sw * 0.4} />
            <path {...sf()} d="M7,8 Q7,6 8.5,6 Q10,6 10,7.5 Q10,9 8.5,9.5" strokeWidth={sw * 0.9} />
            <circle cx="8.5" cy="11" r="0.5" fill="currentColor" strokeWidth={0} />
            <line {...sf(0.6)} x1="15" y1="8" x2="18" y2="8" strokeWidth={sw * 0.8} />
            <line {...sf(0.6)} x1="15" y1="10.5" x2="18" y2="10.5" strokeWidth={sw * 0.8} />
            <line {...sf(0.6)} x1="15" y1="13" x2="17" y2="13" strokeWidth={sw * 0.8} />
          </>
        );

      case "donate":
        // Serce z krzyżem — wsparcie/darowizna
        return (
          <>
            <path {...sf()} d="M12,20 C12,20 3,14 3,8.5 C3,5.5 5.5,3.5 8,3.5 C9.5,3.5 11,4.5 12,5.5 C13,4.5 14.5,3.5 16,3.5 C18.5,3.5 21,5.5 21,8.5 C21,14 12,20 12,20 Z" />
            <line {...sf(0.9)} x1="12" y1="8" x2="12" y2="13" strokeWidth={sw * 0.8} stroke="white" />
            <line {...sf(0.9)} x1="9.5" y1="10.5" x2="14.5" y2="10.5" strokeWidth={sw * 0.8} stroke="white" />
          </>
        );

      case "chat":
        return (
          <>
            <path {...sf()} d="M4,4 Q3,4 3,5 L3,16 Q3,17 4,17 L8,17 L8,21 L13,17 L20,17 Q21,17 21,16 L21,5 Q21,4 20,4 Z" />
            <line {...sf(0.7)} x1="7" y1="9" x2="17" y2="9" strokeWidth={sw * 0.8} />
            <line {...sf(0.7)} x1="7" y1="12.5" x2="14" y2="12.5" strokeWidth={sw * 0.8} />
          </>
        );

      case "etiquette":
        // Cylinder (top hat) — symbol savoir-vivre'u
        return (
          <>
            {/* Rondo kapelusza */}
            <path {...sf()} d="M4,15.5 Q4,17 5.5,17 L18.5,17 Q20,17 20,15.5 Q20,14 18.5,14 L5.5,14 Q4,14 4,15.5 Z" />
            {/* Główka kapelusza */}
            <path {...sf()} d="M8,14 L8,6 Q8,4.5 12,4.5 Q16,4.5 16,6 L16,14" />
            {/* Wstążka */}
            <line {...sf()} x1="8" y1="11" x2="16" y2="11" strokeWidth={sw * 0.85} />
            {/* Ozdobna wstążka po bokach */}
            <line {...sf(0.5)} x1="8" y1="11.8" x2="16" y2="11.8" strokeWidth={sw * 0.4} />
            {/* Mały krzyżyk nad kapeluszem */}
            <line {...sf(0.6)} x1="12" y1="2" x2="12" y2="4" strokeWidth={sw * 0.8} />
            <line {...sf(0.6)} x1="10.8" y1="3" x2="13.2" y2="3" strokeWidth={sw * 0.8} />
          </>
        );

      case "announcements":
        // Tabliczka z ogłoszeniami
        return (
          <>
            <rect {...sf()} x="3" y="3" width="18" height="14" rx="2.5" />
            <line {...sf()} x1="7" y1="8" x2="17" y2="8" strokeWidth={sw * 0.85} />
            <line {...sf()} x1="7" y1="11.5" x2="14" y2="11.5" strokeWidth={sw * 0.85} />
            <path {...sf(0.7)} d="M9,17 L9,21 M15,17 L15,21 M9,21 L15,21" strokeWidth={sw * 0.7} />
          </>
        );

      case "about":
        // Budynek / kolumny (instytut)
        return (
          <>
            <rect {...sf()} x="3" y="10" width="18" height="11" rx="1" />
            <path {...sf()} d="M2,10 L12,3 L22,10" />
            <line {...sf()} x1="9" y1="21" x2="9" y2="14" />
            <line {...sf()} x1="15" y1="21" x2="15" y2="14" />
            <line {...sf(0.6)} x1="12" y1="21" x2="12" y2="14" strokeWidth={sw * 0.6} />
          </>
        );

      case "video-play":
        // Ekran z trójkątem play
        return (
          <>
            <rect {...sf()} x="2" y="4" width="20" height="14" rx="2.5" />
            <path stroke="currentColor" strokeWidth={0} fill="currentColor" opacity={0.85} d="M10,8.5 L16,11 L10,13.5 Z" />
            <line {...sf(0.5)} x1="8" y1="21" x2="16" y2="21" strokeWidth={sw * 0.9} />
            <line {...sf(0.5)} x1="12" y1="18" x2="12" y2="21" strokeWidth={sw * 0.9} />
          </>
        );

      case "quote":
        return (
          <>
            <path {...sf()} d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path {...sf()} d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {renderIcon()}
    </svg>
  );
}
