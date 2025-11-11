import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useClientesProveedoresStore } from "./ClientesProveedoresStore";

// --- NUEVA FUNCIÓN PARA CALCULAR EL TOTAL DE UN ITEM ---
// Esta lógica ahora es más compleja
function calcularItemTotal(item) {
  // 1. Determina el precio base
  // (Si hay un precio modificado, úsalo. Si no, usa el precio de venta original)
  const precioBase = (item.precio_modificado !== null && item.precio_modificado !== undefined)
    ? parseFloat(item.precio_modificado)
    : parseFloat(item._precio_venta);
  
  // 2. Calcula el subtotal
  const cantidad = parseFloat(item._cantidad) || 0;
  const subtotal = precioBase * cantidad;

  // 3. Calcula el descuento
  const descuentoNum = parseFloat(item.descuento) || 0;
  let descuentoCalculado = 0;
  if (item.descuento_es_porcentaje) {
    descuentoCalculado = subtotal * (descuentoNum / 100);
  } else {
    descuentoCalculado = descuentoNum;
  }

  // 4. Retorna el total del item
  return subtotal - descuentoCalculado;
}

// --- NUEVA FUNCIÓN PARA CALCULAR EL TOTAL DE TODO EL CARRITO ---
function calcularTotal(items) {
  return items.reduce((totalAcc, item) => totalAcc + calcularItemTotal(item), 0);
}

const initialState = {
  items: [],
  total: 0,
  statePantallaCobro: false,
  tipocobro: "",
  stateMetodosPago: false,
};

export const useCartVentasStoreTemporal = create(
  persist(
    (set, get) => ({
  	  ...initialState,
      
      // Función auxiliar para obtener el total de un item (la usaremos en la UI)
      getItemTotal: (item) => calcularItemTotal(item),

      // --- FUNCIÓN 'addItem' MEJORADA ---
  	  addItem: (p) =>
  		set((state) => {
          // Buscamos si ya existe (mismo producto Y mismo almacén)
  		  const existingItem = state.items.find(
  			(item) => item._id_producto === p._id_producto && item._id_almacen === p._id_almacen
  		  );
        const cantidadPedida = p._cantidad || 1;
          if (cantidadPedida > p._stock_maximo) {
            toast.error(`Stock insuficiente. Solo quedan ${p._stock_maximo} unidades.`);
            return state; // No hacemos nada
          }
          // ¡NUEVO! Creamos el objeto completo del carrito
          const newItem = {
            ...p,
            id: Date.now(), // ID único para esta LÍNEA del carrito
            nombre_modificado: null, // Para el nombre personalizado
            precio_modificado: null, // Para el precio personalizado
            descuento: 0,
            descuento_es_porcentaje: false,
            detalle: "",
            es_fraccionada: false,
          };

  		  if (existingItem) {
  			const newQuantity = existingItem._cantidad + cantidadPedida;
            // ¡NUEVO! Validamos al sumar
            if (newQuantity > existingItem._stock_maximo) {
              toast.error(`Stock máximo alcanzado: ${existingItem._stock_maximo} unidades.`);
              return state; // No hacemos nada
            }

  			const updatedItems = state.items.map((item) => {
  			  if (item._id_producto === p._id_producto && item._id_almacen === p._id_almacen) {
  				return { ...item, _cantidad: newQuantity };
  			  }
  			  return item;
  			});
  			return { items: updatedItems, total: calcularTotal(updatedItems) };
  		  } else {
  			// Si no existe, añadimos el nuevo objeto completo
  			return {
  			  items: [...state.items, newItem],
  			  total: calcularTotal([...state.items, newItem]),
  			};
  		  }
  		}),

      // --- ¡NUEVA FUNCIÓN PARA ACTUALIZAR UN ITEM! ---
      updateItem: (itemId, newDatos) => 
        set((state) => {
          const itemToUpdate = state.items.find(item => item.id === itemId);
          if (!itemToUpdate) return state;

          // ¡NUEVO! Validamos el stock desde el modal
          if (!newDatos.es_fraccionada) {
            const nuevaCantidad = parseFloat(newDatos._cantidad) || 0;
            if (nuevaCantidad > itemToUpdate._stock_maximo) {
              toast.error(`Stock insuficiente. Solo quedan ${itemToUpdate._stock_maximo} unidades.`);
              newDatos._cantidad = itemToUpdate._cantidad; 
            }
          }
          
          const updatedItems = state.items.map(item => {
            if (item.id === itemId) {
              return { ...item, ...newDatos };
            }
            return item;
          });
          return { items: updatedItems, total: calcularTotal(updatedItems) };
        }),

      // --- FUNCIONES ANTIGUAS (ACTUALIZADAS) ---
  	  removeItem: (itemToRemove) => // Ahora recibe el 'item' completo
  		set((state) => {
  		  const updatedItems = state.items.filter((item) => item.id !== itemToRemove.id); // Usamos el ID único
  		  return {
  			items: updatedItems,
  			total: calcularTotal(updatedItems),
  		  };
  		}),

  	  resetState: () => {
  		const { selectCliPro } = useClientesProveedoresStore.getState();
  		selectCliPro([]);
  		set(initialState);
  	  },

      // Reinicia solo la UI (para el botón "volver" de la pantalla de cobro)
      resetUiStates: () =>
        set({
          statePantallaCobro: false,
          stateMetodosPago: false,
          tipocobro: "",
        }),

  	  addcantidadItem: (itemToUpdate) =>
  		set((state) => {
  		  const updatedItems = state.items.map((item) => {
  			if (item.id === itemToUpdate.id) { 
              // ¡Solo validamos si NO es fraccionada!
              if (!itemToUpdate.es_fraccionada && item._cantidad >= item._stock_maximo) {
                toast.error(`Stock máximo alcanzado: ${item._stock_maximo}`);
                return item;
              }
  			  const updatedItem = { ...item, _cantidad: item._cantidad + 1 };
  			  return updatedItem;
  			}
  			return item;
  		  });
  		  return { items: updatedItems, total: calcularTotal(updatedItems) };
  		}),

  	  restarcantidadItem: (itemToUpdate) =>
  		set((state) => {
  		  const updatedItems = state.items
  			.map((item) => {
  			  if (item.id === itemToUpdate.id && item._cantidad > 0) { // Usamos el ID único
  				const updatedQuantity = item._cantidad - 1;
  				if (updatedQuantity === 0) {
  				  return null; // Será filtrado
  				} else {
  				  const updatedItem = {
  					...item,
  					_cantidad: updatedQuantity,
  				  };
  				  return updatedItem;
  				}
  			  }
  			  return item;
  			})
  			.filter(Boolean); //Filtlar elementos nulos
  		  return { items: updatedItems, total: calcularTotal(updatedItems) };
  		}),
        
  	  updateCantidadItem: (itemToUpdate, cantidad) =>
  		set((state) => {
          const newQty = parseFloat(cantidad) || 0;

          // ¡NUEVA VALIDACIÓN DE STOCK!
          // ¡Solo validamos si NO es fraccionada!
          if (!itemToUpdate.es_fraccionada && newQty > itemToUpdate._stock_maximo) {
             toast.error(`Stock insuficiente. Solo quedan ${itemToUpdate._stock_maximo} unidades.`);
             return state;
          }

  		  const updatedItems = state.items.map((item) => {
  			if (item.id === itemToUpdate.id) { 
  			  const updatedItem = { ...item, _cantidad: newQty };
  			  return updatedItem;
  			}
  			return item;
  		  });
  		  return { items: updatedItems, total: calcularTotal(updatedItems) };
  		}),

  	  setStatePantallaCobro: (p) =>
  		set((state) => {
  		  if (state.items.length === 0) {
  			toast.warning("Agrega productos para continuar.");
  			return { state }; // No cambia nada
  		  } else {
  			return {
  			  statePantallaCobro: !state.statePantallaCobro,
  			  tipocobro: p.tipocobro,
  			};
  		  }
  		}),
  	  setStateMetodosPago: () =>
  		set((state) => ({ stateMetodosPago: !state.stateMetodosPago })),
  	}),
  	{
  	  name: "cart-ventas-storage",
  	}
  )
);