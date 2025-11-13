import { create } from "zustand";
import {
  BuscarUsuariosAsignados,
  MostrarSucursalCajaAsignada,
  MostrarUsuariosAsignados,
} from "../supabase/crudAsignacionCajaSucursal";
import { supabase } from "../supabase/supabase.config";
const tabla = "asignacion_sucursal";
export const useAsignacionCajaSucursalStore = create((set) => ({
  buscador: "",
  setBuscador: (p) => {
    set({ buscador: p });
  },
  accion: "",
  setAccion: (p) => {
    set({ accion: p });
  },
  selectItem: null,
  setSelectItem: (p) => {
    set({ selectItem: p });
  },

  dataSucursalesAsignadas: null,
  sucursalesItemSelectAsignadas: null,
  mostrarSucursalAsignadas: async (p) => {
    // 👇 AÑADIR ESTA VALIDACIÓN
    if (!p.id_usuario) {
      console.warn("mostrarSucursalAsignadas OMITIDO: No se proporcionó id_usuario.");
      // Limpiamos los datos para evitar mostrar datos de un usuario anterior
      set({ dataSucursalesAsignadas: null });
      set({ sucursalesItemSelectAsignadas: null });
      return null; // Detenemos la ejecución
    }
    // 👇 Si el ID es válido, la consulta se ejecuta como siempre
    const { data } = await supabase
      .from(tabla)
      .select(`*, sucursales(*), caja(*)`)
      .eq("id_usuario", p.id_usuario);
    set({ dataSucursalesAsignadas: data });
    set({ sucursalesItemSelectAsignadas: data && data[0] });
    return data;
  },

  mostrarUsuariosAsignados: async (p) => {
    const response = await MostrarUsuariosAsignados(p);
    set({ datausuariosAsignados: response });
    return response;
  },
  buscarUsuariosAsignados: async (p) => {
    const response = await BuscarUsuariosAsignados(p);
    set({ datausuariosAsignados: response });
    return response;
  },
  insertarAsignacionSucursal: async (p) => {
    const { error } = await supabase.from(tabla).insert(p);
    if (error) {
      throw new Error(error.message);
    }
  },
}));
