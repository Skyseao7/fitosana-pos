// En: src/tanstack/MovStockStack.jsx
// ¡CÓDIGO CORREGIDO!

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// (Importa todos tus stores)
import { useProductosStore } from "../store/ProductosStore";
import { useMovStockStore } from "../store/MovStockStore";
import { useAlmacenesStore } from "../store/AlmacenesStore";
import { useFormattedDate } from "../hooks/useFormattedDate";
import { useStockStore } from "../store/StockStore"; 
import { useGlobalStore } from "../store/GlobalStore";

export const useInsertarMovStockMutation = () => {
  const queryClient = useQueryClient();
  const {  productosItemSelect, resetProductosItemSelect } = useProductosStore();
  const { setStateClose } = useGlobalStore();
  
  // --- ¡CAMBIO 1! ---
  // Ya no leemos 'tipo' aquí. Solo traemos las funciones.
  const { insertarMovStock } = useMovStockStore();
  const {  editarStock } = useStockStore();
  const { almacenSelectItem } = useAlmacenesStore();
  const { editarPreciosProductos } = useProductosStore();
  const fechaActual = useFormattedDate();

  return useMutation({
  	mutationKey: ["insertar movimiento stock"],
  	mutationFn: async (data) => {
      
      // --- ¡CAMBIO 2! ---
      // Obtenemos el 'tipo' FRESCO desde el store en el momento del clic.
      const tipoFresco = useMovStockStore.getState().tipo;
      
  	  const dataStockActual = useStockStore.getState().dataStockXAlmacenYProducto;

  	  if (!dataStockActual || !dataStockActual.id) {
  		throw new Error("No se pudo obtener la ID del stock. Vuelva a seleccionar el producto y almacén.");
  	  }
  	  
      // Validamos el stock si es una SALIDA
  	  if (tipoFresco === "salida" && dataStockActual.stock < parseFloat(data.cantidad)) {
  		throw new Error(`Stock insuficiente. Solo hay ${dataStockActual.stock} unidades.`);
  	  }

  	  const pMovimientoStock = {
  		id_almacen: almacenSelectItem?.id,
  		id_producto: productosItemSelect?.id,
        // --- ¡CAMBIO 3! ---
  		tipo_movimiento: tipoFresco, // <-- Usamos el valor fresco
  		cantidad: parseFloat(data.cantidad),
  		fecha: fechaActual,
  		detalle: "registro de inventario manual",
  		origen: "inventario",
  	  };

  	  const pStock = {
  		_id: dataStockActual.id, 
  		cantidad: parseFloat(data.cantidad),
  	  };

  	  const pProductos = {
  		id: productosItemSelect?.id,
  		precio_compra: parseFloat(
  		  (productosItemSelect?.precio_compra + data.precio_compra) / 2
  		),
  		precio_venta: parseFloat(
  		  (productosItemSelect?.precio_venta + data.precio_venta) / 2
  		),
  	  };
  	  
  	  // 1. Primero, editamos el stock (la operación riesgosa)
      // --- ¡CAMBIO 4! ---
  	  await editarStock(pStock, tipoFresco); // <-- Usamos el valor fresco
      // 2. Si eso funciona, registramos el movimiento
  	  await insertarMovStock(pMovimientoStock);
      // 3. Finalmente, actualizamos precios (si es ingreso)
  	  if (tipoFresco === "ingreso") {
  		await editarPreciosProductos(pProductos);
  	  }
  	},
  	onError: (error) => {
  	  toast.error("Error: " + error.message);
  	},
  	onSuccess: () => {
  	  toast.success("Registro guardado correctamente");
  	  queryClient.invalidateQueries(["buscar productos"]);
  	  queryClient.invalidateQueries(["mostrar Stock XAlmacenes YProducto"]);
  	  queryClient.invalidateQueries(["mostrar stock xalmacenyproducto"]); 
  	  queryClient.invalidateQueries(["mostrar movstock"]); 
  	  setStateClose(false);
  	  resetProductosItemSelect();
  	},
  });
};