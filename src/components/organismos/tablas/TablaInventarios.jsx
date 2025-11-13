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
export function TablaInventarios({ data: dataProp, onRowClick }) {
  const [pagina, setPagina] = useState(1);
  const [columnFilters, setColumnFilters] = useState([]);
  const { dataempresa } = useEmpresaStore();
  const data = useMemo(() => dataProp ?? [], [dataProp]);
  
  const columns = [
  	{
  	  accessorKey: "nombre_producto", 
  	  header: "Nombre",
  	  cell: (info) => <span>{info.getValue()}</span>,
  	},
    { 
     accessorKey: "marca", 
      header: "Marca",
      cell: (info) => <span>{info.getValue() || 'Sin Marca'}</span>,
      enableColumnFilter: true,
    },
    {
  	  accessorKey: "stock_total",
  	  header: "Stock Total",
  	  cell: (info) => <strong>{info.getValue()}</strong>,
  	},
    {
      // El accesor ahora es 'precio_venta'
  	  accessorKey: "precio_venta",
  	  header: "Precio",
  	  cell: (info) => <span>{FormatearNumeroDinero(info.getValue(), dataempresa?.currency, dataempresa?.iso)}</span>,
  	},
    {
      // El accesor ahora es 'costo_unidad' (o 'p_compra' si así lo dejaste en el SQL)
  	  accessorKey: "costo_unidad", 
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
            // --- ¡AÑADIDO onRowClick! ---
    	  	  <tr 
              key={item.id} 
              onClick={() => onRowClick(item.original)} 
              style={{ cursor: 'pointer' }}
            >
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
