import { create } from "zustand";
import {
  BuscarCategorias,
  EditarCategorias,
  EliminarCategorias,
  InsertarCategorias,
  MostrarCategorias,
} from "../index";

export const useCategoriasStore = create((set, get) => ({
  buscador: "",
  setBuscador: (p) => {
    set({ buscador: p });
  },
  datacategorias: [],
  categoriaItemSelect: null,
  parametros: {},
  mostrarCategorias: async (p) => {
    const response = await MostrarCategorias(p);
    const data = response || []; //
    set({ parametros: p });
    set({ datacategorias: data });
    set({ categoriaItemSelect: data.length > 0 ? data[0] : null });
    return data;
  },
  selectCategoria: (p) => {
    set({ categoriaItemSelect: p });
  },
  insertarCategorias: async (p, file) => {
    // Llama a la RPC. Asumimos que devuelve el ID (como en tu código SQL)
    const nuevoId = await InsertarCategorias(p, file); 
    
    // Vuelve a cargar las categorías
    const { mostrarCategorias } = get();
    const { parametros } = get();
    await mostrarCategorias(parametros); // 👈 Llama con await, sin 'set'

    // Devuelve el ID para que 'handleCreateMarca' pueda usarlo
    return nuevoId; 
  },

  eliminarCategoria: async (p) => {
    await EliminarCategorias(p);
    const { mostrarCategorias } = get();
    const { parametros } = get();
    await mostrarCategorias(parametros);
  },
  editarCategoria: async (p, fileold, filenew) => {
    await EditarCategorias(p, fileold, filenew);
    const { mostrarCategorias } = get();
    const { parametros } = get();
    await mostrarCategorias(parametros);
  },
  buscarCategorias: async (p) => {
    const response = await BuscarCategorias(p);
    set({ datacategorias: response || [] });
    return response;
  },
}));
