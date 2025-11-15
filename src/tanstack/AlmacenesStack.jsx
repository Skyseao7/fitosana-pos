import { useQuery } from "@tanstack/react-query";

import { useAlmacenesStore } from "../store/AlmacenesStore";
import { useCierreCajaStore } from "../store/CierreCajaStore";
import { useSucursalesStore } from "../store/SucursalesStore";

export const useMostrarAlmacenesXSucursalQuery = () => {
  const { sucursalesItemSelect } = useSucursalesStore();
  const { dataSucursales } = useSucursalesStore();
  const { dataCierreCaja } = useCierreCajaStore();
  const { mostrarAlmacenesXSucursal } = useAlmacenesStore();
  return useQuery({
    queryKey: [
      "mostrar almacen por sucursal",
      { id_sucursal: dataCierreCaja?.caja?.id_sucursal },
    ],
    queryFn: () =>
      mostrarAlmacenesXSucursal({
        id_sucursal: dataCierreCaja?.caja?.id_sucursal,
      }),
    enabled: !!dataCierreCaja,
  });
};
export const useMostrarAlmacenesXSucursalInventarioQuery = () => {
  const { sucursalesItemSelect } = useSucursalesStore();
  
  const { mostrarAlmacenesXSucursal } = useAlmacenesStore();
  return useQuery({
    queryKey: [
      "mostrar almacen por sucursal",
      { id_sucursal: sucursalesItemSelect?.id },
    ],
    queryFn: () =>
      mostrarAlmacenesXSucursal({
        id_sucursal: sucursalesItemSelect.id,
      }),
    enabled: !!sucursalesItemSelect,
  });
};

// Este hook trae TODOS los almacenes de TODAS las sucursales
// y la información de su sucursal (un "join").
export const useMostrarTodosLosAlmacenesConSucursalQuery = () => {
  // Asumimos que esta función la crearás en tu store (ver siguiente paso)
  const { mostrarTodosLosAlmacenesConSucursal } = useAlmacenesStore(); 

  return useQuery({
    // Un queryKey único para esta nueva data
    queryKey: ["mostrar_todos_los_almacenes_con_sucursal"],
    queryFn: () => mostrarTodosLosAlmacenesConSucursal(),
    // No necesita 'enabled' si siempre debe cargarse
  });
};