import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/supabase.config"; // 👈 AÑADIDO: Necesitamos esto
import { useEmpresaStore } from "../store/EmpresaStore"; 
import { useProductosStore } from "../store/ProductosStore"; 
// Ya no importamos 'MostrarProductos', llamaremos a rpc() directamente

// --- Este hook de búsqueda parece estar bien, lo dejamos como estaba ---
export const useBuscarProductosQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { buscador, buscarProductos } = useProductosStore();
  return useQuery({
    queryKey: ["buscar productos", dataempresa?.id, buscador], 
    queryFn: () =>
      buscarProductos({ id_empresa: dataempresa?.id, buscador: buscador }),
    enabled: !!dataempresa && !!buscador, 
    refetchOnWindowFocus: false,
  });
};


// --- HOOK MODIFICADO ---
// Ahora acepta id_sucursal
export const useMostrarProductosQuery = (id_empresa, id_sucursal) => {
  return useQuery({
    // 1. La queryKey AHORA incluye id_sucursal
    // Esto es VITAL para que se actualice al cambiar de sucursal
    queryKey: ['mostrarproductos', id_empresa, id_sucursal], 

    queryFn: async () => {
      // 2. Si no tenemos sucursal, no hacemos nada (devuelve un array vacío)
      if (!id_empresa || !id_sucursal) return []; 

      // 3. Llamamos a la NUEVA función SQL que creamos en el Paso 1
      const { data, error } = await supabase.rpc("mostrar_productos_por_sucursal", {
        _id_empresa: id_empresa,
        _id_sucursal: id_sucursal, // <-- Le pasamos el ID de la sucursal
      });

      if (error) {
        throw new Error("Error al mostrar productos por sucursal: " + error.message);
      }
      return data;
    },

    // 4. La consulta solo se habilita si AMBOS IDs existen
    enabled: !!id_empresa && !!id_sucursal, 
  });
};