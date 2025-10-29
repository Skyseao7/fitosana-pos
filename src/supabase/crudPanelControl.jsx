import { supabase } from "../index";
import Swal from "sweetalert2"; // Opcional, pero bueno para errores

const tablaTareas = "tareas";
const tablaRecordatorios = "recordatorios_vencimiento";

// --- TAREAS (TO-DO LIST) ---

export async function MostrarTareas(p) {
  const { data, error } = await supabase
    .from(tablaTareas)
    .select()
    .eq("id_empresa", p.id_empresa)
    .eq("completada", false) // Solo mostrar las no completadas
    .order("fecha_creacion", { ascending: false });
  
  if (error) {
    Swal.fire("Error", "No se pudieron cargar las tareas: " + error.message, "error");
    throw new Error(error.message);
  }
  return data;
}

export async function InsertarTarea(p) {
  const { data, error } = await supabase
    .from(tablaTareas)
    .insert(p) // p debe ser { id_empresa, descripcion, id_usuario_creador }
    .select();
    
  if (error) {
    Swal.fire("Error", "No se pudo crear la tarea: " + error.message, "error");
    throw new Error(error.message);
  }
  return data;
}

export async function CompletarTarea(p) {
  const { data, error } = await supabase
    .from(tablaTareas)
    .update({ completada: true })
    .eq("id", p.id); // p debe ser { id }
    
  if (error) {
    Swal.fire("Error", "No se pudo completar la tarea: " + error.message, "error");
    throw new Error(error.message);
  }
  return data;
}

// --- RECORDATORIOS DE VENCIMIENTO ---

export async function MostrarRecordatorios(p) {
  const hoy = new Date();
  const unMesDespues = new Date(new Date().setMonth(hoy.getMonth() + 1));
  const fechaLimite = unMesDespues.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const fechaHoy = hoy.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(tablaRecordatorios)
    .select()
    .eq("id_empresa", p.id_empresa)
    .eq("completado", false) // Solo los no completados
    .lte("fecha_vencimiento", fechaLimite) // Menor o igual a 1 mes desde hoy
    .gte("fecha_vencimiento", fechaHoy) // Que no estén ya vencidos
    .order("fecha_vencimiento", { ascending: true }); // Los más urgentes primero

  if (error) {
    Swal.fire("Error", "No se pudieron cargar los recordatorios: " + error.message, "error");
    throw new Error(error.message);
  }
  return data;
}

export async function InsertarRecordatorio(p) {
  const { data, error } = await supabase
    .from(tablaRecordatorios)
    .insert(p) // p debe ser { id_empresa, descripcion, fecha_vencimiento }
    .select();
    
  if (error) {
    Swal.fire("Error", "No se pudo crear el recordatorio: " + error.message, "error");
    throw new Error(error.message);
  }
  return data;
}

export async function CompletarRecordatorio(p) {
  const { data, error } = await supabase
    .from(tablaRecordatorios)
    .update({ completado: true })
    .eq("id", p.id); // p debe ser { id }
    
  if (error) {
    Swal.fire("Error", "No se pudo completar el recordatorio: " + error.message, "error");
    throw new Error(error.message);
  }
  return data;
}