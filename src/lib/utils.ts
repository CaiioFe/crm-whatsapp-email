export function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "sem data";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "sem data";
    const diff = Date.now() - date.getTime();
    if (diff < 0) return "agora";
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return `agora`;
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mês`;
}

export function scoreColor(score: number): string {
    if (score >= 80) return "#ef4444"; // Hot
    if (score >= 40) return "#f59e0b"; // Warm
    return "#94a3b8"; // Cold
}

export function getInitials(name: string) {
    return name
        .split(" ")
        .filter(n => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
}
