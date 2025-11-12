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
