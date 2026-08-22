"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DATES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30,
];
const GOAL_BARS = [72, 48, 36, 52, 32, 45, 38, 44, 52, 32, 48, 62];

export function ThemePrototypeCardsCalendar() {
  return (
    <div className="grid grid-cols-[1.05fr_0.95fr] gap-4">
      <CalendarCard />
      <GoalCard />
    </div>
  );
}

function CalendarCard() {
  return (
    <Card className="min-h-80 py-5 shadow-none">
      <CardHeader className="flex-row items-center justify-between px-5 py-0">
        <Button className="size-7" size="icon" variant="ghost" aria-label="上个月">
          <ChevronLeft />
        </Button>
        <CardTitle className="text-sm">June 2025</CardTitle>
        <Button className="size-7" size="icon" variant="ghost" aria-label="下个月">
          <ChevronRight />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-7 gap-y-2 px-4 pt-4 text-center text-xs">
        {DAYS.map((day) => (
          <span className="text-muted-foreground" key={day}>
            {day}
          </span>
        ))}
        {DATES.map((date) => (
          <span
            className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground grid size-7 place-items-center rounded-full"
            data-selected={date === 5 || date === 13}
            key={date}
          >
            {date}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}

function GoalCard() {
  const [goal, setGoal] = useState(350);
  return (
    <Card className="min-h-80 shadow-none">
      <CardHeader>
        <CardTitle>Move Goal</CardTitle>
        <CardDescription>Set your daily activity goal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-6">
          <Button
            className="size-7 rounded-full"
            size="icon"
            variant="outline"
            onClick={() => setGoal((value) => Math.max(200, value - 10))}
          >
            <Minus />
          </Button>
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">{goal}</div>
            <div className="text-muted-foreground text-[10px] uppercase">Calories/day</div>
          </div>
          <Button
            className="size-7 rounded-full"
            size="icon"
            variant="outline"
            onClick={() => setGoal((value) => Math.min(400, value + 10))}
          >
            <Plus />
          </Button>
        </div>
        <div className="flex h-20 items-end gap-1.5">
          {GOAL_BARS.map((height, index) => (
            <span
              className="bg-primary flex-1 rounded-sm"
              key={`${height}-${index}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="secondary">
          Set Goal
        </Button>
      </CardFooter>
    </Card>
  );
}
