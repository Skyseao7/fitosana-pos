import { supabase } from "../supabase/supabase.config";
import { useQuery } from "@tanstack/react-query";
import { 
  MostrarStockActual, 
  MostrarStockXAlmacenYProducto 
} from "../supabase/crudStock";

// --- ¡NUEVO! ---
// Hook para la tabla principal de Inventario
// (Tu Inventario.jsx ya está usando este)
export const useMostrarStockActualQuery = (id_empresa) => {
  return useQuery({
    queryKey: ["mostrar stock actual", id_empresa],
    queryFn: () => MostrarStockActual({ id_empresa: id_empresa }),
    enabled: !!id_empresa, 
  });
};

// --- ¡CORREGIDO! ---
// Hook para los modales (Ingreso, Salida, Transferencia)
// Ahora ACEPTA parámetros en lugar de leer de Zustand
export const useMostrarStockXAlmacenYProductoQuery = (id_almacen, id_producto) => {
  return useQuery({
    queryKey: [
      "mostrar stock xalmacenyproducto", // Key corregida
      { id_almacen, id_producto },
    ],
    queryFn: () =>
      MostrarStockXAlmacenYProducto({
        id_almacen: id_almacen,
        id_producto: id_producto,
      }),
    // Se ejecutará solo si ambos IDs existen
    enabled: !!id_almacen && !!id_producto, 
  });
};

// --- PEGA ESTO AL FINAL DE src/tanstack/StockStack.jsx ---

// Hook para la vista principal (Resumen de Inventario)
export const useMostrarInventarioTotalQuery = (id_empresa) => {
  return useQuery({
    queryKey: ['mostrarInventarioTotal', id_empresa],
    queryFn: async () => {
      // 1. Llama a la función SQL que creamos
      const { data, error } = await supabase.rpc('mostrar_inventario_total', {
        _id_empresa: id_empresa
      });
      if (error) throw new Error(error.message);
      return data;
    },
    // Solo se ejecuta si id_empresa tiene un valor
    enabled: !!id_empresa, 
  });
};

// Hook para el modal (Detalle de Stock por producto)
export const useMostrarStockDesglosadoQuery = (id_producto) => {
  return useQuery({
    queryKey: ['mostrarStockDesglosado', id_producto],
    queryFn: async () => {
      // 2. Llama a la otra función SQL que creamos
      const { data, error } = await supabase.rpc('mostrar_stock_desglosado', {
        _id_producto: id_producto
      });
      if (error) throw new Error(error.message);
      return data;
    },
    // Solo se ejecuta si id_producto tiene un valor
    enabled: !!id_producto,
  });
};