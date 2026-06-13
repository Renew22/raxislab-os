"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { X, Check, GripVertical, Plus, ChevronLeft, ChevronRight, FileText, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Agencia" | "Trading" | "Personal" | "Contenido";

type Task = {
  id: string;
  label: string;
  completed: boolean;
  note: string;
  category: Category;
};

type DayData = {
  tasks: Task[];
  slots: Record<string, string | null>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

const CATS: { label: Category; color: string }[] = [
  { label: "Agencia",   color: "var(--accent)" },
  { label: "Trading",   color: "var(--amber)"  },
  { label: "Personal",  color: "var(--green)"  },
  { label: "Contenido", color: "#8B5CF6"        },
];

const CAT_COLOR: Record<Category, string> = {
  Agencia:   "var(--accent)",
  Trading:   "var(--amber)",
  Personal:  "var(--green)",
  Contenido: "#8B5CF6",
};

const INITIAL_TASKS: Task[] = [
  { id:"t1", label:"Responder Identity",         completed:false, note:"", category:"Agencia"   },
  { id:"t2", label:"Revisar trading",            completed:false, note:"", category:"Trading"   },
  { id:"t3", label:"Publicar GBP Desancho",      completed:false, note:"", category:"Contenido" },
  { id:"t4", label:"Preparar contenido YouTube", completed:false, note:"", category:"Contenido" },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDateLabel(d: Date): string {
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const dMid = new Date(d);    dMid.setHours(0, 0, 0, 0);
  const diff = Math.round((dMid.getTime() - todayMid.getTime()) / 86_400_000);
  const short = d.toLocaleDateString("es-ES", { weekday:"short", day:"numeric", month:"short" });
  if (diff === 0)  return `Hoy · ${short}`;
  if (diff === 1)  return `Mañana · ${short}`;
  if (diff === -1) return `Ayer · ${short}`;
  return short;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function lsKey(k: string) { return `raxislab_agenda_v2_${k}`; }

function loadDay(dateKey: string): DayData {
  if (typeof window === "undefined") return { tasks: [], slots: {} };
  try {
    const raw = localStorage.getItem(lsKey(dateKey));
    if (raw) return JSON.parse(raw) as DayData;
  } catch {}
  if (dateKey === toDateKey(new Date())) return { tasks: INITIAL_TASKS, slots: {} };
  return { tasks: [], slots: {} };
}

function saveDay(dateKey: string, data: DayData) {
  try { localStorage.setItem(lsKey(dateKey), JSON.stringify(data)); } catch {}
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: "5px",
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text)", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit",
};

const BTN_ICON: React.CSSProperties = {
  padding: "2px", border: "none", background: "transparent",
  color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0,
};

// ─── CategoryChips ────────────────────────────────────────────────────────────

function CategoryChips({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {CATS.map(({ label, color }) => (
        <button key={label} onClick={() => onChange(label)} style={{
          padding: "3px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer",
          border: `1px solid ${value === label ? color : "var(--border)"}`,
          background: value === label ? color + "22" : "transparent",
          color: value === label ? color : "var(--text-muted)",
          fontWeight: value === label ? 700 : 400,
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── TaskModal (edit) ─────────────────────────────────────────────────────────

function TaskModal({ task, onSave, onDelete, onClose }: {
  task: Task;
  onSave: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [label,    setLabel]    = useState(task.label);
  const [note,     setNote]     = useState(task.note);
  const [category, setCategory] = useState<Category>(task.category);

  function handleSave() {
    onSave({ label: label.trim() || task.label, note, category });
    onClose();
  }

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"22px", width:"340px", boxShadow:"0 12px 40px rgba(0,0,0,0.45)" }}
      >
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
          <h3 style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", margin:0 }}>Editar tarea</h3>
          <button onClick={onClose} style={BTN_ICON}><X size={16} /></button>
        </div>

        <label style={{ fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"4px" }}>Nombre</label>
        <input value={label} onChange={e => setLabel(e.target.value)} style={{ ...INPUT, marginBottom:"14px" }} />

        <label style={{ fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>Categoría</label>
        <div style={{ marginBottom:"14px" }}>
          <CategoryChips value={category} onChange={setCategory} />
        </div>

        <label style={{ fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"4px" }}>Nota</label>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="Añade una nota..."
          rows={3}
          style={{ ...INPUT, resize:"vertical", marginBottom:"18px" }}
        />

        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <button
            onClick={() => { onDelete(); onClose(); }}
            style={{ padding:"7px 10px", borderRadius:"5px", border:"1px solid var(--red)", background:"transparent", color:"var(--red)", cursor:"pointer", fontSize:"12px", display:"flex", alignItems:"center", gap:"4px" }}
          >
            <Trash2 size={12} /> Eliminar
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding:"8px 14px", borderRadius:"5px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{ padding:"8px 14px", borderRadius:"5px", border:"none", background:"var(--accent)", color:"var(--bg)", cursor:"pointer", fontSize:"13px", fontWeight:700 }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NewTaskModal ─────────────────────────────────────────────────────────────

function NewTaskModal({ onAdd, onClose }: {
  onAdd: (label: string, category: Category) => void;
  onClose: () => void;
}) {
  const [label,    setLabel]    = useState("");
  const [category, setCategory] = useState<Category>("Agencia");

  function handleAdd() {
    if (!label.trim()) return;
    onAdd(label.trim(), category);
    onClose();
  }

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"22px", width:"320px", boxShadow:"0 12px 40px rgba(0,0,0,0.45)" }}
      >
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
          <h3 style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", margin:0 }}>Nueva tarea</h3>
          <button onClick={onClose} style={BTN_ICON}><X size={16} /></button>
        </div>

        <label style={{ fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"4px" }}>Nombre</label>
        <input
          autoFocus
          value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Nombre de la tarea..."
          style={{ ...INPUT, marginBottom:"14px" }}
        />

        <label style={{ fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>Categoría</label>
        <div style={{ marginBottom:"18px" }}>
          <CategoryChips value={category} onChange={setCategory} />
        </div>

        <button
          onClick={handleAdd}
          disabled={!label.trim()}
          style={{
            width:"100%", padding:"9px", borderRadius:"5px", border:"none",
            background: label.trim() ? "var(--accent)" : "var(--border)",
            color: label.trim() ? "var(--bg)" : "var(--text-muted)",
            cursor: label.trim() ? "pointer" : "default",
            fontSize:"13px", fontWeight:700,
          }}
        >
          Añadir tarea
        </button>
      </div>
    </div>
  );
}

// ─── DraggableTask ────────────────────────────────────────────────────────────

function DraggableTask({ task, inSlot, onToggle, onEdit, onRemove }: {
  task: Task; inSlot: boolean;
  onToggle: () => void;
  onEdit:   () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const color = CAT_COLOR[task.category];

  return (
    <div
      ref={setNodeRef}
      style={{
        display:"flex", alignItems:"center", gap:"5px",
        padding:"5px 7px", borderRadius:"5px",
        background: isDragging ? "var(--accent-dim)" : "var(--card-hover)",
        border: `1px solid ${isDragging ? "var(--border-accent)" : "var(--border)"}`,
        borderLeft: `3px solid ${color}`,
        opacity: isDragging ? 0.4 : task.completed ? 0.4 : 1,
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        zIndex: isDragging ? 999 : "auto",
        flex: inSlot ? 1 : undefined,
        userSelect:"none", boxSizing:"border-box",
      }}
    >
      {/* Drag handle */}
      <div
        {...listeners} {...attributes}
        style={{ display:"flex", alignItems:"center", gap:"3px", flex:1, cursor:"grab", minWidth:0 }}
      >
        <GripVertical size={10} style={{ color:"var(--border)", flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{
            fontSize:"12px", color:"var(--text-mid)", display:"block",
            textDecoration: task.completed ? "line-through" : "none",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {task.label}
          </span>
          {task.note && (
            <span style={{
              fontSize:"10px", color:"var(--text-muted)", display:"block",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.3,
            }}>
              {task.note}
            </span>
          )}
        </div>
      </div>

      {/* Edit */}
      <button onPointerDown={e => e.stopPropagation()} onClick={onEdit} style={BTN_ICON}>
        <FileText size={10} />
      </button>

      {/* Checkbox */}
      <button
        onPointerDown={e => e.stopPropagation()} onClick={onToggle}
        style={{
          width:15, height:15, borderRadius:"3px", flexShrink:0, padding:0, cursor:"pointer",
          border:`1px solid ${task.completed ? "var(--green)" : "var(--border)"}`,
          background: task.completed ? "var(--green)" : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
      >
        {task.completed && <Check size={8} strokeWidth={3} style={{ color:"var(--bg)" }} />}
      </button>

      {/* Remove from slot */}
      {inSlot && onRemove && (
        <button onPointerDown={e => e.stopPropagation()} onClick={onRemove} style={BTN_ICON}>
          <X size={10} />
        </button>
      )}
    </div>
  );
}

// ─── TimeSlot ─────────────────────────────────────────────────────────────────

function TimeSlot({ hour, task, isCurrentHour, onToggle, onRemove, onEdit }: {
  hour: number; task: Task | null; isCurrentHour: boolean;
  onToggle: () => void; onRemove: () => void; onEdit: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}` });

  return (
    <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
      <span style={{
        width:40, fontSize:"11px", textAlign:"right", flexShrink:0,
        fontFamily:"'Space Mono', monospace",
        color: isCurrentHour ? "var(--accent)" : "var(--text-muted)",
        fontWeight: isCurrentHour ? 700 : 400,
      }}>
        {String(hour).padStart(2,"0")}:00
      </span>
      <div
        ref={setNodeRef}
        style={{
          flex:1, minHeight:36, borderRadius:"5px", padding:"3px 6px",
          display:"flex", alignItems:"center",
          border: isCurrentHour
            ? "1px solid var(--accent)"
            : isOver ? "1px dashed var(--border-accent)" : "1px solid var(--border)",
          background: isCurrentHour ? "var(--accent-dim)" : isOver ? "var(--card-hover)" : "transparent",
          transition:"border 0.12s, background 0.12s",
        }}
      >
        {task ? (
          <DraggableTask task={task} inSlot onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} />
        ) : isOver ? (
          <span style={{ fontSize:"11px", color:"var(--accent)", userSelect:"none" }}>Soltar aquí</span>
        ) : null}
      </div>
    </div>
  );
}

// ─── UnassignedPanel ──────────────────────────────────────────────────────────

function UnassignedPanel({ tasks, onToggle, onEdit, onAddNew }: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit:   (task: Task) => void;
  onAddNew: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <div style={{ width:200, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
        <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", margin:0 }}>
          Sin asignar
        </p>
        <button
          onClick={onAddNew}
          style={{
            display:"flex", alignItems:"center", gap:"3px", padding:"3px 8px",
            borderRadius:"4px", border:"1px solid var(--border)", background:"transparent",
            color:"var(--text-muted)", cursor:"pointer", fontSize:"11px",
          }}
        >
          <Plus size={11} /> Nueva
        </button>
      </div>
      <div
        ref={setNodeRef}
        style={{
          minHeight:80, borderRadius:"6px", padding:"7px",
          border: isOver ? "1px dashed var(--border-accent)" : "1px solid var(--border)",
          background: isOver ? "var(--accent-dim)" : "var(--card)",
          display:"flex", flexDirection:"column", gap:"5px",
          transition:"border 0.12s, background 0.12s",
        }}
      >
        {tasks.length === 0 ? (
          <p style={{ fontSize:"11px", color:"var(--text-muted)", textAlign:"center", padding:"12px 0", margin:0 }}>
            Todas asignadas ✓
          </p>
        ) : tasks.map(t => (
          <DraggableTask
            key={t.id} task={t} inSlot={false}
            onToggle={() => onToggle(t.id)}
            onEdit={() => onEdit(t)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── DatePicker ───────────────────────────────────────────────────────────────

function DatePicker({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
  const isToday = toDateKey(date) === toDateKey(new Date());
  const NAV_BTN: React.CSSProperties = {
    padding:"5px", borderRadius:"5px", border:"1px solid var(--border)",
    background:"transparent", color:"var(--text-muted)", cursor:"pointer",
    display:"flex", alignItems:"center",
  };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"16px" }}>
      <button onClick={() => onChange(addDays(date, -1))} style={NAV_BTN}>
        <ChevronLeft size={14} />
      </button>
      <span style={{ flex:1, textAlign:"center", fontSize:"13px", fontWeight:600, color:"var(--text)" }}>
        {formatDateLabel(date)}
      </span>
      {!isToday && (
        <button
          onClick={() => onChange(new Date())}
          style={{ padding:"4px 10px", borderRadius:"4px", border:"1px solid var(--border-accent)", background:"var(--accent-dim)", color:"var(--accent)", cursor:"pointer", fontSize:"11px", fontWeight:600 }}
        >
          Hoy
        </button>
      )}
      <button onClick={() => onChange(addDays(date, 1))} style={NAV_BTN}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── DaySummary ───────────────────────────────────────────────────────────────

function DaySummary({ tasks }: { tasks: Task[] }) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const allDone   = completed === total;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"12px",
      padding:"12px 16px", borderRadius:"6px", marginBottom:"14px",
      background: allDone ? "#22C55E18" : "var(--card-hover)",
      border: `1px solid ${allDone ? "var(--green)" : "var(--border)"}`,
    }}>
      <span style={{ fontSize:"20px" }}>{allDone ? "🎉" : "📋"}</span>
      <div>
        <p style={{ fontSize:"13px", fontWeight:700, color: allDone ? "var(--green)" : "var(--text)", margin:"0 0 2px" }}>
          {allDone ? "¡Día completado!" : `${completed} / ${total} tareas completadas`}
        </p>
        <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0 }}>
          {allDone
            ? `${total} tarea${total !== 1 ? "s" : ""} · Buen trabajo`
            : `${total - completed} pendiente${total - completed !== 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgendaDnD() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [slots,        setSlots]        = useState<Record<string, string | null>>({});
  const [hydrated,     setHydrated]     = useState(false);
  const [editingTask,  setEditingTask]  = useState<Task | null>(null);
  const [showNewTask,  setShowNewTask]  = useState(false);

  const currentHour = new Date().getHours();
  const dateKey     = toDateKey(selectedDate);
  const isToday     = dateKey === toDateKey(new Date());

  // ── Load today on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const day = loadDay(toDateKey(new Date()));
    setTasks(day.tasks);
    setSlots(day.slots);
    setHydrated(true);
  }, []);

  // ── Persist whenever tasks / slots change ───────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    saveDay(dateKey, { tasks, slots });
  }, [tasks, slots, hydrated, dateKey]);

  // ── Navigate to a different date ────────────────────────────────────────────
  function goToDate(newDate: Date) {
    saveDay(dateKey, { tasks, slots });          // flush current day first
    const day = loadDay(toDateKey(newDate));
    setTasks(day.tasks);
    setSlots(day.slots);
    setSelectedDate(newDate);
  }

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const taskId = String(active.id);
    const dest   = String(over.id);

    setSlots(prev => {
      const next = { ...prev };
      for (const h of HOURS) {
        if (next[String(h)] === taskId) next[String(h)] = null;
      }
      if (dest.startsWith("slot-")) {
        next[dest.slice(5)] = taskId;
      }
      // dest === "unassigned" → already cleared above
      return next;
    });
  }

  // ── Task actions ─────────────────────────────────────────────────────────────
  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function removeFromSlot(hour: number) {
    setSlots(prev => ({ ...prev, [String(hour)]: null }));
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSlots(prev => {
      const next = { ...prev };
      for (const h of HOURS) {
        if (next[String(h)] === id) next[String(h)] = null;
      }
      return next;
    });
  }

  function addTask(label: string, category: Category) {
    const newTask: Task = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label, category, completed: false, note: "",
    };
    setTasks(prev => [...prev, newTask]);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const assignedIds = new Set(Object.values(slots).filter(Boolean) as string[]);
  const unassigned  = tasks.filter(t => !assignedIds.has(t.id));

  const showSummary = tasks.length > 0 && (
    tasks.every(t => t.completed) || (isToday && currentHour >= 22)
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>

      <DatePicker date={selectedDate} onChange={goToDate} />

      {showSummary && <DaySummary tasks={tasks} />}

      <div style={{ display:"flex", gap:"20px", alignItems:"flex-start" }}>

        {/* Time grid */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"3px" }}>
          {HOURS.map(hour => {
            const taskId = slots[String(hour)] ?? null;
            const task   = taskId ? (tasks.find(t => t.id === taskId) ?? null) : null;
            return (
              <TimeSlot
                key={hour} hour={hour} task={task}
                isCurrentHour={isToday && hour === currentHour}
                onToggle={() => task && toggleTask(task.id)}
                onRemove={() => removeFromSlot(hour)}
                onEdit={() => task && setEditingTask(task)}
              />
            );
          })}
        </div>

        {/* Unassigned panel */}
        <UnassignedPanel
          tasks={unassigned}
          onToggle={toggleTask}
          onEdit={setEditingTask}
          onAddNew={() => setShowNewTask(true)}
        />
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask}
          onSave={updates => updateTask(editingTask.id, updates)}
          onDelete={() => deleteTask(editingTask.id)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {showNewTask && (
        <NewTaskModal onAdd={addTask} onClose={() => setShowNewTask(false)} />
      )}

    </DndContext>
  );
}
