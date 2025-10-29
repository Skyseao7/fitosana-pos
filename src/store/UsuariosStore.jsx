import { create } from "zustand";
import {
  EditarUsuarios,
  EliminarUsuarioAsignado,
  InsertarCredencialesUser,
  InsertarUsuarios,
} from "../index";
import { InsertarAsignacionCajaSucursal } from "../supabase/crudAsignacionCajaSucursal";
import { usePermisosStore } from "./PermisosStore";
import { InsertarPermisos } from "../supabase/crudPermisos";
import { supabase } from "../supabase/supabase.config";
const tabla = "usuarios";
export const useUsuariosStore = create((set) => ({
  refetchs: null,
  datausuarios: [],
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
  mostrarusuarios: async (p) => {
    console.log("🏁 Ejecutando mostrarusuarios con:", p.id_auth);
    try {
      // Paso 1: Obtener datos del usuario (como ya lo hacías)
      const { data: dataUsuario, error: errorUsuario } = await supabase
        .from(tabla) // "usuarios"
        .select(`*, roles(*)`)
        .eq("id_auth", p.id_auth)
        .maybeSingle();

      if (errorUsuario) {
        console.error("💥 Supabase error en MostrarUsuarios:", errorUsuario);
        throw new Error(errorUsuario.message);
      }
      
      // Si no se encuentra el usuario, no podemos continuar
      if (!dataUsuario) {
        console.warn("🤔 Usuario no encontrado con id_auth:", p.id_auth);
        set({ datausuarios: null }); 
        return null;
      }

      // Paso 2: Usar el ID del usuario para buscar su asignación y empresa
      const { data: dataAsignacion, error: errorAsignacion } = await supabase
        .from("asignacion_sucursal")
        .select("sucursales(id_empresa)") // Solo queremos el id_empresa de la tabla sucursales
        .eq("id_usuario", dataUsuario.id)
        .maybeSingle(); // Asumimos que un usuario está en una sucursal

      if (errorAsignacion) {
        console.error("💥 Supabase error en Asignacion:", errorAsignacion.message);
        // No lanzamos error, solo no tendremos id_empresa
      }

      // Paso 3: Combinar los datos del usuario con el id_empresa
      const fullData = { 
        ...dataUsuario, 
        // El resultado es { sucursales: { id_empresa: 123 } }
        // Usamos Optional Chaining (?.) por si no tiene asignación
        id_empresa: dataAsignacion?.sucursales?.id_empresa || null 
      };

      console.log("📥 Resultado Supabase Combinado:", fullData);

      set({ datausuarios: fullData });
      return fullData;

    } catch (err) {
      console.error("🔥 ERROR inesperado:", err);
      throw err;
    }
  },
  eliminarUsuarioAsignado: async (p) => {
    await EliminarUsuarioAsignado(p);
  },
  insertarUsuario: async (p) => {
    const selectModules = usePermisosStore.getState().selectedModules || [];
    console.log("Módulos seleccionados:", selectModules);
    const data = await InsertarCredencialesUser({
      email: p.email,
      pass: p.pass,
    });
    const dataUserNew = await InsertarUsuarios({
      nombres: p.nombres,
      nro_doc: p.nro_doc,
      telefono: p.telefono,
      id_rol: p.id_rol,
      correo: p.email,
      id_auth: data,
    });
    await InsertarAsignacionCajaSucursal({
      id_sucursal: p.id_sucursal,
      id_usuario: dataUserNew?.id,
      id_caja: p.id_caja,
    });

    if (Array.isArray(selectModules) && selectModules.length > 0) {
      selectModules.forEach(async (idModule) => {
        let p = {
          id_usuario: dataUserNew?.id,
          idmodulo: idModule,
        };
        await InsertarPermisos(p);
      });
    } else {
      throw new Error("No hay módulos seleccionados");
    }
  },
  editarUsuarios: async (p) => {
    await EditarUsuarios(p);
  },
  editarThemeUser: async (p) => {
    const { error } = await supabase.from(tabla).update(p).eq("id", p.id);
    if (error) {
      throw new Error(error.message);
    }
  },
}));
