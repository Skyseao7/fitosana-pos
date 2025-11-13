
import { supabase } from "../index";
const tabla = "productos";
export async function InsertarProductos(p) {
  const { error, data } = await supabase.rpc("insertarproductos", p);
  if (error) {
    throw new Error(error.message);
  }
  console.log(data);
  return data;
}

export async function MostrarProductos(p) {
  const { data } = await supabase.rpc("mostrarproductos", {
    _id_empresa: p.id_empresa,
  });
  return data;
}
export async function BuscarProductos(p) {
  const { data, error } = await supabase.rpc("buscarproductos", {
    _id_empresa: p.id_empresa,
    buscador: p.buscador,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function EliminarProductos(p) {
  const { error } = await supabase.from(tabla).delete().eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}
export async function EditarProductos(p) {
  const { error } = await supabase.rpc('editarproductos', {
    _id: p._id,
    _nombre: p._nombre,
    _precio_venta: p._precio_venta,
    _precio_compra: p._precio_compra,
    _id_categoria: p._id_categoria,
    _codigo_barras: p._codigo_barras,
    _codigo_interno: p._codigo_interno,
    _id_empresa: p._id_empresa,
    _sevende_por: p._sevende_por,
    _maneja_inventarios: p._maneja_inventarios,
    _detalles: p._detalles // 👈 AÑADIDO
  });
  if (error) throw new Error(error.message);
}

export async function MostrarUltimoProducto(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", p.id_empresa)
    .order("id", { ascending: false })
    .maybeSingle();

  return data;
}
export async function CrearProductoConStock(p) {
  const { error } = await supabase.rpc('crear_producto_con_stock', {
    _nombre: p._nombre,
    _precio_venta: p._precio_venta,
    _precio_compra: p._precio_compra,
    _id_categoria: p._id_categoria,
    _codigo_barras: p._codigo_barras,
    _codigo_interno: p._codigo_interno,
    _id_empresa: p._id_empresa,
    _sevende_por: p._sevende_por,
    _id_almacen: p._id_almacen, // Nuevo parámetro
    _stock_inicial: p._stock_inicial, // Nuevo parámetro
    _detalles: p._detalles,
  });

  if (error) {
    throw new Error(error.message);
  }
}