interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: "blue" | "green" | "yellow" | "red";
}

const colorMap = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  red: "bg-red-50 border-red-200 text-red-700",
};

export function StatCard({ title, value, description, color = "blue" }: StatCardProps) {
  return (
    <div className={`rounded-lg border p-6 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {description && <p className="mt-1 text-xs opacity-70">{description}</p>}
    </div>
  );
}
