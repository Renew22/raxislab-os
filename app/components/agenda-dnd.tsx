"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { X, Check, GripVertical } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Task = { id: string; label: string; completed: boolean };

const INITIAL_TASKS: Task[] = [
  { id: "t1", label: "Responder Identity",         completed: false },
  { id: "t2", label: "Revisar trading",            completed: false },
  { id: "t3", label: "Publicar GBP Desancho",      completed: false },
  { id: "t4", label: "Preparar contenido YouTube", completed: false },
];

const HOURS  = Array.from({ length: 15 }, (_, i) => i + 8); // 8–22
const LS_KEY = "raxislab_agenda";

// ─── DraggableTask ────────────────────────────────────────────────────────────

function DraggableTask({ task, inSlot, onToggle, onRemove }: {
  task: Task;
  inSlot: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 8px",
        borderRadius: "5px",
        background: isDragging ? "var(--accent-dim)" : "var(--card-hover)",
        border: `1px solid ${isDragging ? "var(--border-accent)" : "var(--border)"}`,
        opacity: isDragging ? 0.4 : task.completed ? 0.4 : 1,
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        zIndex: isDragging ? 999 : "auto",
        flex: inSlot ? 1 : undefined,
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, cursor: "grab", minWidth: 0 }}
      >
        <GripVertical size={11} style={{ color: "var(--border)", flexShrink: 0 }} />
        <span style={{
          fontSize: "12px",
          color: "var(--text-mid)",
          textDecoration: task.completed ? "line-through" : "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {task.label}
        </span>
      </div>

      {/* Checkbox */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onToggle}
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "3px",
          flexShrink: 0,
          border: `1px solid ${task.completed ? "var(--green)" : "var(--border)"}`,
          background: task.completed ? "var(--green)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {task.completed && <Check size={9} strokeWidth={3} style={{ color: "var(--bg)" }} />}
      </button>

      {/* Remove from slot */}
      {inSlot && onRemove && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRemove}
          style={{
            padding: "2px",
            borderRadius: "3px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ─── TimeSlot ─────────────────────────────────────────────────────────────────

function TimeSlot({ hour, task, isCurrentHour, onToggle, onRemove }: {
  hour: number;
  task: Task | null;
  isCurrentHour: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}` });
  const label = `${String(hour).padStart(2, "0")}:00`;

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <span style={{
        width: "40px",
        fontSize: "11px",
        textAlign: "right",
        flexShrink: 0,
        fontFamily: "'Space Mono', monospace",
        color: isCurrentHour ? "var(--accent)" : "var(--text-muted)",
        fontWeight: isCurrentHour ? 700 : 400,
      }}>
        {label}
      </span>

      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: "36px",
          borderRadius: "5px",
          padding: "3px 6px",
          display: "flex",
          alignItems: "center",
          border: isCurrentHour
            ? "1px solid var(--accent)"
            : isOver
            ? "1px dashed var(--border-accent)"
            : "1px solid var(--border)",
          background: isCurrentHour
            ? "var(--accent-dim)"
            : isOver
            ? "var(--card-hover)"
            : "transparent",
          transition: "border 0.12s, background 0.12s",
        }}
      >
        {task ? (
          <DraggableTask task={task} inSlot onToggle={onToggle} onRemove={onRemove} />
        ) : isOver ? (
          <span style={{ fontSize: "11px", color: "var(--accent)", userSelect: "none" }}>Soltar aquí</span>
        ) : null}
      </div>
    </div>
  );
}

// ─── UnassignedPanel ─────────────────────────────────────────────────────────

function UnassignedPanel({ tasks, onToggle }: {
  tasks: Task[];
  onToggle: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div style={{ width: "196px", flexShrink: 0 }}>
      <p style={{
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        marginBottom: "10px",
        margin: "0 0 10px 0",
      }}>
        Sin asignar
      </p>
      <div
        ref={setNodeRef}
        style={{
          minHeight: "80px",
          borderRadius: "6px",
          padding: "8px",
          border: isOver ? "1px dashed var(--border-accent)" : "1px solid var(--border)",
          background: isOver ? "var(--accent-dim)" : "var(--card)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          transition: "border 0.12s, background 0.12s",
        }}
      >
        {tasks.length === 0 ? (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "12px 0", margin: 0 }}>
            Todas asignadas ✓
          </p>
        ) : (
          tasks.map(t => (
            <DraggableTask
              key={t.id}
              task={t}
              inSlot={false}
              onToggle={() => onToggle(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgendaDnD() {
  const [tasks,    setTasks]    = useState<Task[]>(INITIAL_TASKS);
  const [slots,    setSlots]    = useState<Record<number, string | null>>({});
  const [hydrated, setHydrated] = useState(false);

  const currentHour = new Date().getHours();

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const { tasks: t, slots: s } = JSON.parse(raw);
        if (Array.isArray(t)) setTasks(t);
        if (s && typeof s === "object") setSlots(s);
      }
    } catch { /* ignore corrupt data */ }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ tasks, slots }));
  }, [tasks, slots, hydrated]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const taskId = String(active.id);
    const dest   = String(over.id);

    setSlots(prev => {
      const next = { ...prev };
      // Detach from current slot
      for (const h of HOURS) {
        if (next[h] === taskId) next[h] = null;
      }
      if (dest.startsWith("slot-")) {
        const hour = parseInt(dest.slice(5));
        next[hour] = taskId;
      }
      // dest === "unassigned" → already detached above
      return next;
    });
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function removeFromSlot(hour: number) {
    setSlots(prev => ({ ...prev, [hour]: null }));
  }

  const assignedIds = new Set(Object.values(slots).filter(Boolean) as string[]);
  const unassigned  = tasks.filter(t => !assignedIds.has(t.id));

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* Time grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          {HOURS.map(hour => {
            const taskId = slots[hour] ?? null;
            const task   = taskId ? (tasks.find(t => t.id === taskId) ?? null) : null;
            return (
              <TimeSlot
                key={hour}
                hour={hour}
                task={task}
                isCurrentHour={hour === currentHour}
                onToggle={() => task && toggleTask(task.id)}
                onRemove={() => removeFromSlot(hour)}
              />
            );
          })}
        </div>

        {/* Unassigned panel */}
        <UnassignedPanel tasks={unassigned} onToggle={toggleTask} />
      </div>
    </DndContext>
  );
}
