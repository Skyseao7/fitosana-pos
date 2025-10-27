import { create } from "zustand";
import { supabase } from "../supabase/supabase.config";
import {
  EditarStock,
  InsertarStock,
  MostrarStockXAlmacenesYProducto,
  MostrarStockXAlmacenYProducto,
} from "../supabase/crudStock";


export const useStockStore = create((set, get ) => ({
  stateModal: false,
  setStateModal: (p) => {
    set({ stateModal: p });
  },
  insertarStock: async (p) => {
    await InsertarStock(p);
  },
  dataStockXAlmacenYProducto: [],
  mostrarStockXAlmacenYProducto: async (p) => {
    const response = await MostrarStockXAlmacenYProducto(p);
    set({ dataStockXAlmacenYProducto: response });
    return response;
  },
  dataStockXAlmacenesYProducto: [],
  mostrarStockXAlmacenesYProducto: async (p) => {
    const response = await MostrarStockXAlmacenesYProducto(p);
    set({ dataStockXAlmacenesYProducto: response });
    return response;
  },
  editarStock: async (p,tipo) => {
    await EditarStock(p,tipo);
  },

  //nueva función para actualizar detalles
  actualizarDetallesStock: async (p) => {
    // p = { id: ID_DEL_REGISTRO_DE_STOCK, ubicacion: 'nuevo valor' }
    const { error } = await supabase.rpc('actualizar_detalles_stock', {
        _id: p.id,
        _ubicacion: p.ubicacion,
    });

    if (error) {
      console.error("Error en RPC actualizar_detalles_stock:", error);
      throw new Error(`Error al actualizar detalles del stock: ${error.message}`);
    }
    console.log("Detalles de stock actualizados (via RPC):", p);
    // Aquí no necesitamos invalidar ninguna query de stock específica,
    // ya que la de productos se invalida después en RegistrarProductos.
  },
}));
