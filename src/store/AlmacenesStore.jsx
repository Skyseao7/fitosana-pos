import { create } from "zustand";
import {
  EliminarAlmacen,
  MostrarAlmacenXSucursal,
  MostrarAlmacenesXEmpresa,
  InsertarAlmacen,
  EditarAlmacen,
  MostrarAlmacenesXSucursal,
  MostrarTodosLosAlmacenesConSucursal, 
} from "../index";

export const useAlmacenesStore = create((set, get) => ({
  stateAlmacen: false,
  setStateAlmacen: (p) => set({ stateAlmacen: p }),
  accion: "",
  setAccion: (p) => set({ accion: p }),
  almacenSelectItem: [],
  setAlmacenSelectItem: (p) => {
    set({ almacenSelectItem: p });
  },

  dataalmacen: [],
  dataalmacenxsucursalxproducto: [],
  
  mostrarAlmacenXsucursal: async (p) => {
    const response = await MostrarAlmacenXSucursal(p);
    set({ dataalmacenxsucursalxproducto: response });
    const { dataalmacenxsucursalxproducto } = get();
    return dataalmacenxsucursalxproducto;
  },
  dataAlmacenesXempresa: null,
  mostrarAlmacenesXEmpresa: async (p) => {
    const response = await MostrarAlmacenesXEmpresa(p);
    set({ dataAlmacenesXsucursal: response }); // ¿Quizás quisiste poner dataAlmacenesXempresa aquí?
    return response;
  },
  dataAlmacenesXsucursal: null,
  mostrarAlmacenesXSucursal: async (p) => {
    const response = await MostrarAlmacenesXSucursal(p);
    set({ almacenSelectItem: response[0] });
    set({ dataAlmacenesXsucursal: response });
    return response;
  },
 
  insertarAlmacen: async (p) => {
    await InsertarAlmacen(p);
  },
  eliminarAlmacen: async (p) => {
    await EliminarAlmacen(p);
  },
  editarAlmacen: async (p) => {
    await EditarAlmacen(p);
  },

  // --- ¡NUEVA FUNCIÓN AÑADIDA! ---
  // Esta función es llamada por el hook de TanStack
  mostrarTodosLosAlmacenesConSucursal: async () => {
    // Llama a la nueva función de Supabase (que importamos)
    const response = await MostrarTodosLosAlmacenesConSucursal();
    // No necesitamos guardarla en el state, TanStack Query la manejará.
    return response;
  },
}));