"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────── */

type ViewMode = "mês" | "semana" | "lista";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  time?: string; // HH:mm
  status?: "scheduled" | "published" | "draft";
}

/* ────────────────────────────────────────────────────────────────────────
   buildGrid: Create a 6×7 grid (42 days, Monday-first)
   ──────────────────────────────────────────────────────────────────────── */

function buildGrid(year: number, month: number): (number | null)[] {
  // 1st of month
  const firstDay = new Date(year, month, 1);
  // Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  const dayOfWeek = firstDay.getDay();
  // Adjust for Monday-first: Monday=0
  let startOffset = dayOfWeek - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: (number | null)[] = [];

  // Fill leading empty days from previous month
  for (let i = 0; i < startOffset; i++) {
    grid.push(null);
  }

  // Fill current month
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i);
  }

  // Fill trailing empty days to complete 6 rows (42 days)
  while (grid.length < 42) {
    grid.push(null);
  }

  return grid;
}

/* ────────────────────────────────────────────────────────────────────────
   formatDatePT: Format date as "quinta-feira, 17 de maio"
   ──────────────────────────────────────────────────────────────────────── */

function formatDatePT(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  const dayNames = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[month];

  return `${dayName}, ${day} de ${monthName}`;
}

/* ────────────────────────────────────────────────────────────────────────
   formatMonthYear: Format month/year as "Maio de 2026"
   ──────────────────────────────────────────────────────────────────────── */

function formatMonthYear(year: number, month: number): string {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${monthNames[month]} de ${year}`;
}

/* ────────────────────────────────────────────────────────────────────────
   getDayKey: Convert year/month/day to yyyy-mm-dd string
   ──────────────────────────────────────────────────────────────────────── */

function getDayKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/* ────────────────────────────────────────────────────────────────────────
   DayPanel: Right sidebar showing events for selected day
   ──────────────────────────────────────────────────────────────────────── */

interface DayPanelProps {
  year: number;
  month: number;
  day: number | null;
  events: CalendarEvent[];
}

function DayPanel({ year, month, day, events }: DayPanelProps) {
  if (day === null) {
    return (
      <div className="sticky top-12 w-80 border-l border-border-subtle">
        <Card density="dense" className="m-4">
          <div className="text-center py-8 text-text-tertiary text-body">
            Selecione um dia para ver os carrosséis agendados.
          </div>
        </Card>
      </div>
    );
  }

  const dayKey = getDayKey(year, month, day);
  const dayEvents = events.filter((e) => e.date === dayKey);

  return (
    <div className="sticky top-12 w-80 border-l border-border-subtle">
      <div className="p-4 border-b border-border-subtle">
        <h3 className="text-h3 text-text-primary">
          {formatDatePT(year, month, day)}
        </h3>
      </div>

      <div className="p-4">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-body">
            Nenhum carrossel agendado para este dia.
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <Card key={event.id} interactive density="dense" className="cursor-pointer">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded bg-bg-surface-2 border border-border-subtle" />
                  <div className="flex-1 min-w-0">
                    <div className="text-body font-medium text-text-primary truncate">
                      {event.title}
                    </div>
                    {event.time && (
                      <div className="text-caption text-text-secondary">
                        {event.time}
                      </div>
                    )}
                    {event.status && (
                      <div className="text-caption text-text-tertiary mt-1">
                        {event.status}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   CalendarGrid: Main month view with day cells
   ──────────────────────────────────────────────────────────────────────── */

interface CalendarGridProps {
  year: number;
  month: number;
  selected: number | null;
  onSelect: (day: number) => void;
  events: CalendarEvent[];
}

function CalendarGrid({ year, month, selected, onSelect, events }: CalendarGridProps) {
  const grid = buildGrid(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  return (
    <div className="flex-1 p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-t-lg overflow-hidden mb-px">
        {dayNames.map((name) => (
          <div
            key={name}
            className="bg-bg-surface-2 py-3 px-2 text-center text-caption font-medium text-text-secondary"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-b-lg overflow-hidden">
        {grid.map((day, idx) => {
          const isOtherMonth = day === null;
          const isToday = day === todayDate && isCurrentMonth;
          const isSelected = day === selected;
          const dayKey = day ? getDayKey(year, month, day) : null;
          const dayEvents = dayKey ? events.filter((e) => e.date === dayKey) : [];

          return (
            <div
              key={idx}
              onClick={() => !isOtherMonth && day && onSelect(day)}
              className={`
                bg-bg-surface min-h-[88px] p-2 transition-colors duration-fast
                ${!isOtherMonth ? "cursor-pointer hover:bg-bg-surface-2" : "bg-bg-surface-2"}
                ${isSelected ? "ring-2 ring-accent ring-inset" : ""}
              `}
            >
              <div className="flex items-start gap-1 mb-2">
                <div className={`text-body font-medium ${isOtherMonth ? "text-text-tertiary" : "text-text-primary"}`}>
                  {day}
                </div>
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1" />
                )}
              </div>

              {/* Event pills */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-[11px] px-2 py-1 rounded bg-accent-muted text-accent truncate"
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] px-2 py-1 text-text-secondary">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Calendar Page
   ──────────────────────────────────────────────────────────────────────── */

export default function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [view, setView] = useState<ViewMode>("mês");
  const [selected, setSelected] = useState<number | null>(today.getDate());

  // Mock events (in real implementation, fetch from API)
  const [events] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Carousel 1",
      date: getDayKey(today.getFullYear(), today.getMonth(), today.getDate()),
      time: "10:00",
      status: "scheduled",
    },
    {
      id: "2",
      title: "Carousel 2",
      date: getDayKey(today.getFullYear(), today.getMonth(), today.getDate()),
      time: "14:30",
      status: "published",
    },
    {
      id: "3",
      title: "Carousel 3",
      date: getDayKey(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      status: "draft",
    },
  ]);

  const handlePrevMonth = () => {
    setCursor((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCursor((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleToday = () => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelected(now.getDate());
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle">
        <h1 className="text-h2 text-text-primary">
          {formatMonthYear(cursor.year, cursor.month)}
        </h1>

        <div className="flex items-center gap-4">
          {/* Navigation buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              iconLeft={<ChevronLeft size={18} />}
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
            />
            <Button
              variant="ghost"
              size="md"
              onClick={handleToday}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="md"
              iconLeft={<ChevronRight size={18} />}
              onClick={handleNextMonth}
              aria-label="Próximo mês"
            />
          </div>

          {/* View toggles */}
          <div className="flex gap-2 border-l border-border-subtle pl-4">
            {(["mês", "semana", "lista"] as ViewMode[]).map((v) => (
              <Chip
                key={v}
                active={view === v}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Chip>
            ))}
          </div>

          {/* Schedule button */}
          <Button
            variant="primary"
            size="md"
            iconLeft={<Plus size={18} />}
            className="ml-4"
          >
            Agendar
          </Button>
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {view === "mês" && (
          <>
            <CalendarGrid
              year={cursor.year}
              month={cursor.month}
              selected={selected}
              onSelect={setSelected}
              events={events}
            />
            <DayPanel
              year={cursor.year}
              month={cursor.month}
              day={selected}
              events={events}
            />
          </>
        )}

        {view === "semana" && (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <div className="text-h3 mb-2">Vista de Semana</div>
              <div className="text-body">Em breve...</div>
            </div>
          </div>
        )}

        {view === "lista" && (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <div className="text-h3 mb-2">Vista de Lista</div>
              <div className="text-body">Em breve...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
