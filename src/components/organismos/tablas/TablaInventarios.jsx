import {
  Paginacion,
  FormatearNumeroDinero,
  useEmpresaStore
} from "../../../index";
import { v } from "../../../styles/variables";
import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaArrowsAltV } from "react-icons/fa";

// Aceptamos 'data' como prop, y la renombramos a 'dataProp'
export function TablaInventarios({ data: dataProp, datacategorias }) {
  const [pagina, setPagina] = useState(1);
  const [columnFilters, setColumnFilters] = useState([]);
  const { dataempresa } = useEmpresaStore();
  // Crea un Mapa para buscar nombres de marca por ID
const marcaLookup = useMemo(() => {
  const map = new Map();
  if (datacategorias) {
    for (const cat of datacategorias) {
      map.set(cat.id, cat.nombre);
    }
  }
  return map;
}, [datacategorias]);
  const data = useMemo(() => dataProp ?? [], [dataProp]);
  
  // (Y corregimos los nombres de 'almacenes' a 'almacen')
  const columns = [
  	{
  	  accessorKey: "productos.nombre",
  	  header: "Nombre",
  	  cell: (info) => <span>{info.getValue()}</span>,
  	},
    { 
      // 1. Obtenemos el ID de la categoría desde el producto
      accessorKey: "productos.id_categoria", 
      header: "Marca",
      // 2. Usamos el ID para buscar el nombre en nuestro mapa
      cell: (info) => {
        const marcaId = info.getValue(); // Esto es el ID (ej: 5)
        const marcaNombre = marcaLookup.get(marcaId); // Busca el nombre (ej: "Fitosana")
        return <span>{marcaNombre || 'Sin Marca'}</span>; // Muestra el nombre
      },
      enableColumnFilter: true,
    },
    {
  	  accessorKey: "almacen.sucursales.nombre", // <-- CORREGIDO
  	  header: "Sucursal",
  	  cell: (info) => <span>{info.getValue()}</span>,
  	},
    {
  	  accessorKey: "stock",
  	  header: "Stock Total",
  	  cell: (info) => <strong>{info.getValue()}</strong>,
  	},
    {
  	  accessorKey: "productos.precio_venta",
  	  header: "Precio",
  	  cell: (info) => <span>{FormatearNumeroDinero(info.getValue(), dataempresa?.currency, dataempresa?.iso)}</span>,
  	},
    {
  	  accessorKey: "productos.p_compra", // Tu C/U
  	  header: "C/U",
  	  cell: (info) => <span>{FormatearNumeroDinero(info.getValue(), dataempresa?.currency, dataempresa?.iso)}</span>,
  	},
  ];

  const table = useReactTable({
  data: data, // <-- ANTES DECÍA: data: data || []
    columns,
  	state: { columnFilters },
  	getCoreRowModel: getCoreRowModel(),
  	getFilteredRowModel: getFilteredRowModel(),
  	getPaginationRowModel: getPaginationRowModel(),
  	getSortedRowModel: getSortedRowModel(),
  	columnResizeMode: "onChange",
  });

  return (
    <> 
      <table className="responsive-table">
          <thead>
          	{table.getHeaderGroups().map((headerGroup) => (
          	  <tr key={headerGroup.id}>
          		{headerGroup.headers.map((header) => (
          		  <th key={header.id}>
          			{header.column.columnDef.header}
          			{header.column.getCanSort() && (
          			  <span onClick={header.column.getToggleSortingHandler()} style={{ cursor: "pointer" }} >
          				<FaArrowsAltV />
          			  </span>
          			)}
          			{{ asc: " 🔼", desc: " 🔽"}[header.column.getIsSorted()] ?? null}
          			<div
          			  onMouseDown={header.getResizeHandler()}
          			  onTouchStart={header.getResizeHandler()}
          			  className={`resizer ${
          				header.column.getIsResizing() ? "isResizing" : ""
          			  }`}
          			/>
          		  </th>
          		))}
          	  </tr>
          	))}
        	</thead>
        	<tbody>
        	  {table.getRowModel().rows.map((item) => (
        		<tr key={item.id}>
        		  {item.getVisibleCells().map((cell) => (
        			<td key={cell.id}>
        			  {flexRender(cell.column.columnDef.cell, cell.getContext())}
        			</td>
      	  		  ))}
    	  		</tr>
    	  	  ))}
  	  	  </tbody>
    	  </table>
  		<Paginacion
  		  table={table}
  		  irinicio={() => table.setPageIndex(0)}
  		  pagina={table.getState().pagination.pageIndex + 1}
  		  setPagina={setPagina}
  		  maximo={table.getPageCount()}
  		/>
  	</>
  );
}
