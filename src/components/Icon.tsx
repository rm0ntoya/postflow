interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 16, className }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "sparkle":     return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case "plus":        return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "grid":        return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "list":        return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case "edit":        return <svg {...common}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case "download":    return <svg {...common}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
    case "eye":         return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eyeOff":      return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>;
    case "search":      return <svg {...common}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>;
    case "settings":    return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case "brain":       return <svg {...common}><path d="M9.5 2A2.5 2.5 0 007 4.5v.5a2.5 2.5 0 00-2 2.45A2.5 2.5 0 003 9.5v.18A2.5 2.5 0 002 12a2.5 2.5 0 001 2 2.5 2.5 0 00.5 4 2.5 2.5 0 003 2 2.5 2.5 0 005 0V4.5A2.5 2.5 0 009.5 2zM14.5 2A2.5 2.5 0 0117 4.5v.5a2.5 2.5 0 012 2.45A2.5 2.5 0 0121 9.5v.18A2.5 2.5 0 0122 12a2.5 2.5 0 01-1 2 2.5 2.5 0 01-.5 4 2.5 2.5 0 01-3 2 2.5 2.5 0 01-5 0V4.5A2.5 2.5 0 0114.5 2z"/></svg>;
    case "user":        return <svg {...common}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "lock":        return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
    case "shield":      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "key":         return <svg {...common}><circle cx="7.5" cy="15.5" r="4.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></svg>;
    case "check":       return <svg {...common} strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>;
    case "x":           return <svg {...common} strokeWidth={2.2}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "flame":       return <svg {...common}><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>;
    case "image":       return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
    case "type":        return <svg {...common}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>;
    case "palette":     return <svg {...common}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
    case "shapes":      return <svg {...common}><path d="M9 2L2 22h14L9 2z"/><circle cx="17" cy="6" r="4"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>;
    case "layout":      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
    case "layers":      return <svg {...common}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
    case "arrowRight":  return <svg {...common}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case "arrowLeft":   return <svg {...common}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case "copy":        return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
    case "trash":       return <svg {...common}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>;
    case "undo":        return <svg {...common}><path d="M3 7v6h6"/><path d="M3 13a9 9 0 109-3 9 9 0 00-9 3"/></svg>;
    case "alignLeft":   return <svg {...common}><path d="M17 10H3M21 6H3M21 14H3M17 18H3"/></svg>;
    case "alignCenter": return <svg {...common}><path d="M18 10H6M21 6H3M21 14H3M18 18H6"/></svg>;
    case "alignRight":  return <svg {...common}><path d="M21 10H7M21 6H3M21 14H3M21 18H7"/></svg>;
    case "instagram":   return <svg {...common}><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"/></svg>;
    case "logout":      return <svg {...common}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case "help":        return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>;
    case "bell":        return <svg {...common}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
    case "folder":      return <svg {...common}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>;
    case "star":        return <svg {...common}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    case "zap":         return <svg {...common}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    default:            return null;
  }
}
