import { supabase } from "./supabase.config";

const tabla = "stock";
export async function InsertarStock(p) {
  const { error } = await supabase.from(tabla).insert(p);
  if (error) {
    throw new Error(error.message);
  }
}
export async function EditarStock(p, tipo) {
  const { error } = await supabase.rpc(
  	tipo === "ingreso" ? "incrementarstock": "reducirstock",p
  );
  if (error) {
  	throw new Error(error.message);
  }
}
export async function MostrarStockXAlmacenYProducto(p) {
  const { data } = await supabase
    .from(tabla)
  	.select()
  	.eq("id_almacen", p.id_almacen)
  	.eq("id_producto", p.id_producto)
  	.maybeSingle();
  return data;
}
export async function MostrarStockXAlmacenesYProducto(p) {
  const { data } = await supabase
  	.from(tabla)
  	.select(`*, almacen(*)`) 
  	.eq("id_producto", p.id_producto)
  	.gt("stock", 0);
  return data;
}

// --- ¡FUNCIÓN CORREGIDA! ---
export async function MostrarStockActual(p) {
  const { data, error } = await supabase
    .from("stock")
    .select(`
      id,
      stock,
      productos ( 
        id, 
        nombre, 
        p_compra: precio_compra,
        precio_venta, 
        codigo_barras,
        id_categoria
      ),
      almacen ( id, nombre, sucursales (id, nombre, id_empresa) ) 
    `) 
    .filter("almacen.sucursales.id_empresa", "eq", p.id_empresa) 
    .order("id", { ascending: false }); 
    
  if (error) {
  	throw new Error("Error al mostrar stock: " + error.message);
  }
  return data.filter(item => item.almacen && item.almacen.sucursales); 
}

// --- ¡NUEVA FUNCIÓN PARA TRANSFERENCIAS! ---
export async function TransferirStock(p) {
  const { error } = await supabase.rpc("transferir_stock", {
    cantidad_transferir: p.cantidad,
    id_producto_transferir: p.id_producto,
    id_almacen_origen: p.id_almacen_origen,
    id_almacen_destino: p.id_almacen_destino,
    id_usuario_transferir: p.id_usuario
  });
  if (error) {
  	throw new Error(error.message);
  }
}