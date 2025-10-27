import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../store/EmpresaStore"; // Asegúrate que la ruta sea correcta
import { useProductosStore } from "../store/ProductosStore"; // Para acceder a mostrarProductos
import { MostrarProductos } from "../supabase/crudProductos"; // 👈 IMPORTA LA FUNCIÓN DE SUPABASE

// Hook para buscar (ya lo tienes)
export const useBuscarProductosQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { buscador, buscarProductos } = useProductosStore(); // buscarProductos viene del store
  return useQuery({
    queryKey: ["buscar productos", dataempresa?.id, buscador], // Incluye id_empresa en la key
    queryFn: () =>
      buscarProductos({ id_empresa: dataempresa?.id, buscador: buscador }), // Llama a la función del store
    enabled: !!dataempresa && !!buscador, // Solo busca si hay empresa y texto en buscador
    refetchOnWindowFocus: false,
  });
};

// 👇 AÑADE ESTE NUEVO HOOK 👇
export const useMostrarProductosQuery = (id_empresa) => {
  return useQuery({
    // queryKey: ['mostrarproductos', id_empresa] es la clave única para esta query.
    // React Query usará esto para cachear los datos.
    queryKey: ['mostrarproductos', id_empresa], 

    // queryFn: La función asíncrona que realmente busca los datos.
    // Llama directamente a tu función RPC de Supabase.
    queryFn: () => MostrarProductos({ id_empresa }), 

    // enabled: !!id_empresa asegura que la query solo se ejecute
    // si id_empresa tiene un valor (no es null ni undefined).
    enabled: !!id_empresa, 
  });
};