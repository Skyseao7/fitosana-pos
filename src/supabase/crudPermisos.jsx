import { supabase } from "../supabase/supabase.config";
const tabla = "permisos";

export async function MostrarPermisos(p) {
  // 👇 INICIO DE LA VALIDACIÓN
  if (!p.id_usuario) {
    console.warn("MostrarPermisos OMITIDO: No se proporcionó id_usuario.");
    return []; // Devuelve un array vacío para no romper React Query
  }
  // 👆 FIN DE LA VALIDACIÓN

  const { data } = await supabase
    .from(tabla)
    .select(`*, modulos(*)`)
    .eq("id_usuario", p.id_usuario);
  return data;
}
export async function MostrarPermisosConfiguracion(p) {
  // 👇 INICIO DE LA VALIDACIÓN
  if (!p.id_usuario) {
    console.warn("MostrarPermisosConfiguracion OMITIDO: No se proporcionó id_usuario.");
    return []; // Devuelve un array vacío
  }
  // 👆 FIN DE LA VALIDACIÓN

  const { data } = await supabase
    .from(tabla)
    .select(`*, modulos!inner(*)`)
    .eq("modulos.etiquetas", "#configuracion")
    .eq("id_usuario", p.id_usuario);
  return data;
}
export async function MostrarPermisosDefault() {
  const { data } = await supabase.from("permisos_dafault").select();
  return data;
}
export async function InsertarPermisos(p) {
  const { error } = await supabase.from(tabla).insert(p).select();
  if (error) {
    throw new Error(error.message);
  }
}

export async function EliminarPermisos(p) {
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("id_usuario", p.id_usuario);
  if (error) {
    throw new Error(error.message);
  }
}

export async function MostrarPermisosGlobales(p) {
  // 👇 INICIO DE LA VALIDACIÓN
  if (!p.id_usuario) {
    console.warn("MostrarPermisosGlobales OMITIDO: No se proporcionó id_usuario.");
    return []; // Devuelve un array vacío
  }
  // 👆 FIN DE LA VALIDACIÓN

  const { data } = await supabase
    .from(tabla)
    .select(`*, modulos(*)`)
    .eq("id_usuario", p.id_usuario);
  return data;
}