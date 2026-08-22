import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ThemePrototypeCardsExercise() {
  return (
    <Card className="min-h-80 shadow-none">
      <CardHeader>
        <CardTitle>Exercise Minutes</CardTitle>
        <CardDescription>
          Your exercise minutes are ahead of where you normally are.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg
          aria-hidden="true"
          className="h-48 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 600 190"
        >
          {[40, 80, 120, 160].map((y) => (
            <line key={y} stroke="var(--border)" x1="0" x2="600" y1={y} y2={y} />
          ))}
          <path
            d="M0 128 C50 140 82 156 110 154 S155 20 205 46 S255 135 308 126 S360 102 420 120 S510 134 600 116"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <path
            d="M0 100 C72 120 130 132 190 136 S280 116 340 126 S420 146 500 132 S560 122 600 112"
            fill="none"
            opacity="0.5"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        </svg>
        <div className="text-muted-foreground grid grid-cols-7 text-center text-xs">
          {DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
