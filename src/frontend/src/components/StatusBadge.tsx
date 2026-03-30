interface StatusBadgeProps {
  value: string;
  type: "status" | "severity";
}

export function StatusBadge({ value, type }: StatusBadgeProps) {
  const getClass = () => {
    if (type === "status") {
      if (value === "Open") return "pill-open";
      if (value === "In Reparatie") return "pill-repair";
      if (value === "Opgelost") return "pill-solved";
    } else {
      if (value === "Laag") return "pill-laag";
      if (value === "Gemiddeld") return "pill-gemiddeld";
      if (value === "Hoog") return "pill-hoog";
    }
    return "pill-repair";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getClass()}`}
    >
      {value}
    </span>
  );
}
